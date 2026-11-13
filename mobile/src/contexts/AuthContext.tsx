import React, { useState, createContext, ReactNode, useEffect, useContext, useCallback, useRef } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";

import { api } from "../services/api";
import { ToastContext } from "./ToastContext";
import { perfilPeloEmail } from "../lib/validacao";
import { MSG_SESSAO_EXPIRADA } from "../lib/getErrorMessage";
import { Area, Perfil } from "../lib/types";

type AuthContextData = {
    user: UserProps;
    isAuthenticated: boolean;
    signIn: (credentials: SignInProps) => Promise<UserProps>;
    loadingAuth: boolean;
    loading: boolean;
    signOut: () => Promise<void>;
    // Só para aluno: true se a API responde 200 em /tutores/me/tutorias
    ehTutor: boolean;
    // Área mostrada para o aluno que é tutor ("aluno" ou "tutor")
    area: Area;
    trocarArea: () => Promise<void>;
    // Só para aluno: confere de novo se virou (ou deixou de ser) tutor. Chamada pelo ProvedorContadores
    conferirTutor: () => Promise<void>;
    // Bolinha no ícone de troca: pedido de tutoria aceito e o aluno ainda não abriu a área do tutor
    bolinhaTroca: boolean;
}

type UserProps = {
    id: number;
    nome: string;
    email: string;
    token: string;
    // Mesmo papel do cookie "perfil" do site: descoberto pelo domínio do e-mail no login
    perfil: Perfil | null;
}

type AuthProviderProps = {
    children: ReactNode;
}

type SignInProps = {
    email: string;
    senha: string;
}

// Mesmas rotas do site (design/src/app/actions.ts)
const ROTA_SESSAO = {
    professor: "/sessao/professores",
    aluno: "/sessao/alunos",
}

const STORAGE_USER = "@protutal";
const STORAGE_AREA = "@protutal:area";
// Último estado de tutor conhecido, por id do aluno (ex.: "@protutal:tutor:12").
// Não é apagado no signOut: assim o aviso de pedido aceito aparece uma vez só, mesmo saindo e entrando
const STORAGE_TUTOR = "@protutal:tutor:";

// Resposta das rotas do tutor quando o vínculo foi revogado (middleware isTutor do back)
const MSG_SEM_VINCULO = "Acesso permitido somente para tutores com vínculo ativo";

// Aviso informativo (não é erro) quando o vínculo acaba com a área do tutor aberta
const MSG_VINCULO_ENCERRADO = "Seu vínculo de tutor foi encerrado. Você voltou para a área do aluno.";

const MSG_TUTORIA_ACEITA ="Seu pedido de tutoria foi aceito! Toque no ícone de troca para acessar a área do tutor.";

// O que fica salvo em STORAGE_TUTOR
type EstadoTutor = {
    tutor: boolean;
    // true até o aluno abrir a área do tutor pela primeira vez depois do aceite
    bolinha: boolean;
}

async function lerEstadoTutor(id: number): Promise<EstadoTutor | null> {
    try {
        const salvo = JSON.parse(await AsyncStorage.getItem(STORAGE_TUTOR + id) || "null");
        if(salvo && typeof salvo.tutor === "boolean") return { tutor: salvo.tutor, bolinha: !!salvo.bolinha };
    } catch {
        // Valor inválido ou falha na leitura: trata como "nada salvo"
    }

    return null;
}

async function gravarEstadoTutor(id: number, estado: EstadoTutor){
    try {
        await AsyncStorage.setItem(STORAGE_TUTOR + id, JSON.stringify(estado));
    } catch {
        // Sem como guardar: vale só enquanto o app estiver aberto
    }
}

const USER_VAZIO: UserProps = {
    id: 0,
    nome: "",
    email: "",
    token: "",
    perfil: null
}

export const AuthContext = createContext({} as AuthContextData);

// Tutor não é perfil de login: ele entra como aluno, e a rota T1 diz se ele é tutor
// (200, mesmo com lista vazia) ou não (403). Erro de rede ou 500: null (não deu para saber)
async function consultarTutor(): Promise<boolean | null> {
    try {
        await api.get("/tutores/me/tutorias");
        return true;
    } catch(err) {
        if(isAxiosError(err) && err.response?.status === 403) return false;
        return null;
    }
}

// No login e ao reabrir o app, "não deu para saber" vale como "não é tutor",
// igual ao site (o ícone de troca fica escondido).
async function verificarTutor(): Promise<boolean> {
    return (await consultarTutor()) ?? false;
}

export function AuthProvider({children}: AuthProviderProps){
    const { showToast } = useContext(ToastContext);

    const [user, setUser] = useState<UserProps>(USER_VAZIO)
    const [ehTutor, setEhTutor] = useState(false)
    const [area, setArea] = useState<Area>("aluno")
    const [bolinhaTroca, setBolinhaTroca] = useState(false)

    const [loadingAuth, setLoadingAuth] = useState(false)
    const [loading, setLoading] = useState(true)

    const isAuthenticated = !!user.token;

    // Área atual para o interceptor (que é criado uma vez só)
    const areaRef = useRef<Area>("aluno");
    areaRef.current = area;

    // Id do usuário logado agora: uma conferência que termina depois de sair (ou trocar de conta) é descartada
    const idRef = useRef(0);
    idRef.current = user.id;
    const conferindo = useRef(false);

    const signOut = useCallback(async () => {
        // Remove só as chaves do Protutal (o AsyncStorage.clear apagaria tudo do app).
        // O último estado de tutor (STORAGE_TUTOR) fica, para o aviso não se repetir
        await AsyncStorage.multiRemove([STORAGE_USER, STORAGE_AREA]);

        delete api.defaults.headers.common["Authorization"];

        setUser(USER_VAZIO);
        setEhTutor(false);
        setArea("aluno");
        setBolinhaTroca(false);
    }, [])

    // Pedido de tutoria aceito (ou vínculo revogado) com o app aberto. Roda junto com a busca dos contadores
    // da área do aluno (ao abrir a área, ao focar as telas e a cada 60 s com o app em primeiro plano).
    // Não existe rota para o aluno ver os próprios pedidos: só o aceite é percebido, pela mesma rota do login
    const conferirTutor = useCallback(async () => {
        const id = user.id;
        if(user.perfil !== "aluno" || !id || conferindo.current) return;

        conferindo.current = true;

        try {
            const tutor = await consultarTutor();
            // Sem conexão ou erro do servidor: não muda nada
            if(tutor === null || idRef.current !== id) return;

            const salvo = await lerEstadoTutor(id);
            if(idRef.current !== id) return;

            setEhTutor(tutor);

            // Primeira vez neste aparelho: só guarda o estado atual, sem aviso
            if(!salvo){
                await gravarEstadoTutor(id, { tutor, bolinha: false });
                setBolinhaTroca(false);
                return;
            }

            // Não era tutor e agora é: o professor aceitou o pedido
            if(tutor && !salvo.tutor){
                await gravarEstadoTutor(id, { tutor: true, bolinha: true });
                setBolinhaTroca(true);
                showToast("sucesso", MSG_TUTORIA_ACEITA);
                return;
            }

            // Era tutor e não é mais: vínculo revogado. Na área do aluno, sem aviso;
            // na área do tutor, volta para a do aluno com o mesmo aviso informativo do interceptor
            if(!tutor && salvo.tutor){
                await gravarEstadoTutor(id, { tutor: false, bolinha: false });
                setBolinhaTroca(false);

                if(areaRef.current === "tutor"){
                    await AsyncStorage.setItem(STORAGE_AREA, "aluno");
                    setArea("aluno");
                    showToast("sucesso", MSG_VINCULO_ENCERRADO);
                }
                return;
            }

            // Nada mudou: mantém a bolinha que estava salva (ex.: reabriu o app sem ter trocado de área)
            setBolinhaTroca(tutor && salvo.bolinha);
        } finally {
            conferindo.current = false;
        }
    }, [user.id, user.perfil, showToast])

    // Reabrindo o app: recupera o usuário salvo e confere de novo se ainda é tutor
    useEffect(() => {

        async function getUser(){

            const userInfo = await AsyncStorage.getItem(STORAGE_USER);
            const hasUser: Partial<UserProps> = JSON.parse(userInfo || "{}")

            if(hasUser.token && (hasUser.perfil === "professor" || hasUser.perfil === "aluno")){
                api.defaults.headers.common["Authorization"] = `Bearer ${hasUser.token}`

                if(hasUser.perfil === "aluno"){
                    const tutor = await verificarTutor();
                    const areaSalva = await AsyncStorage.getItem(STORAGE_AREA);

                    setEhTutor(tutor);
                    // Se o vínculo de tutor foi revogado, volta para a área do aluno
                    setArea(tutor && areaSalva === "tutor" ? "tutor" : "aluno");
                }

                setUser({
                    id: Number(hasUser.id),
                    nome: String(hasUser.nome),
                    email: String(hasUser.email),
                    token: hasUser.token,
                    perfil: hasUser.perfil
                })
            }

            setLoading(false);
        }

        getUser();

    }, [])

    // Sessão expirada: qualquer 401 de uma rota que levou o token desloga e avisa,
    // como o site faz em lib/sessaoExpirada.ts. O 401 do login (senha errada) não leva token.
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (err: unknown) => {
                if(
                    isAxiosError(err) &&
                    err.response?.status === 401 &&
                    err.config?.headers?.Authorization
                ){
                    await signOut();
                    showToast("erro", MSG_SESSAO_EXPIRADA);
                }

                // Vínculo de tutor revogado com a área do tutor aberta: volta para a área do aluno,
                // como o site faz (redirect para /aluno no layout do tutor), com um aviso informativo
                if(
                    isAxiosError(err) &&
                    err.response?.status === 403 &&
                    err.response.data?.error === MSG_SEM_VINCULO &&
                    areaRef.current === "tutor"
                ){
                    await AsyncStorage.setItem(STORAGE_AREA, "aluno");
                    setEhTutor(false);
                    setArea("aluno");
                    showToast("sucesso", MSG_VINCULO_ENCERRADO);
                }

                return Promise.reject(err);
            }
        );

        return () => api.interceptors.response.eject(interceptor);
    }, [signOut, showToast])

    // A tela valida os campos antes (validarLogin). Em caso de erro da API,
    // o erro é repassado para a tela decidir (ex.: 403 = e-mail não confirmado).
    async function signIn({ email, senha }: SignInProps){
        const perfil = perfilPeloEmail(email);

        if(!perfil){
            throw new Error("Domínio de email não permitido");
        }

        setLoadingAuth(true);

        try{
            const response = await api.post(ROTA_SESSAO[perfil], {
                email: email.trim(),
                senha
            })

            const { nome, token } = response.data;

            const data: UserProps = {
                id: perfil === "professor" ? response.data.id_professor : response.data.id_aluno,
                nome,
                email: response.data.email,
                token,
                perfil
            }

            await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(data))
            await AsyncStorage.setItem(STORAGE_AREA, "aluno")

            api.defaults.headers.common["Authorization"] = `Bearer ${token}`

            // Como no site, o aluno sempre começa na área do aluno
            if(perfil === "aluno") setEhTutor(await verificarTutor());
            setArea("aluno");

            setUser(data)

            return data;

        } finally {
            setLoadingAuth(false)
        }
    }

    async function trocarArea(){
        if(!ehTutor) return;

        const nova: Area = area === "aluno" ? "tutor" : "aluno";

        await AsyncStorage.setItem(STORAGE_AREA, nova);
        setArea(nova);

        // Primeira ida para a área do tutor depois do aceite: apaga a bolinha do ícone de troca
        if(nova === "tutor" && bolinhaTroca){
            setBolinhaTroca(false);
            await gravarEstadoTutor(user.id, { tutor: true, bolinha: false });
        }
    }

    return(
        <AuthContext.Provider
        value={{
            user,
            isAuthenticated,
            signIn,
            loading,
            loadingAuth,
            signOut,
            ehTutor,
            area,
            trocarArea,
            conferirTutor,
            bolinhaTroca
            }}>
            {children}
        </AuthContext.Provider>
    )
}
