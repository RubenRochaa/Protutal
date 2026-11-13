import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { AuthContext } from "../contexts/AuthContext";
import { buscarDadosContadores, DadosContadores } from "./contadores";
import { AreaContador, chaveVisita, contarDepois, gravarVisitas, lerVisitas, SufixoVisita, Visitas } from "./ultimaVisita";

// Mesma lógica do site (design/src/lib/useContadores.tsx), adaptada ao app:
// AsyncStorage no lugar do localStorage, foco das telas no lugar da troca de página
// e AppState no lugar da aba visível do navegador

// No máximo uma atualização por minuto, além do foco das telas
const INTERVALO = 60_000;
// Abrir a área dispara a busca do provider e o foco da primeira tela ao mesmo tempo: só uma vale
const MIN_ENTRE_BUSCAS = 1_000;

// Itens que mostram contador (os mesmos do menu do site, em design/src/lib/menus.ts)
export type ChaveContador = "notificacoes" | "atividades" | "desempenho" | "tutoria" | "contestacoes";

interface Contadores {
    // Abas, sino do Header e card de contestações do tutor
    menu: Partial<Record<ChaveContador, number>>;
    // Mensagens novas do chat de cada tutoria (id_tutoria -> quantidade)
    chatPorTutoria: Record<number, number>;
    // Chat + avisos da sala de cada tutoria (card da lista de tutorias do aluno)
    porTutoria: Record<number, number>;
    // Avisos novos de cada sala (atalho "Avisos" do tutor: no app os avisos ficam numa tela separada)
    avisosPorSala: Record<number, number>;
}

interface ValorContexto extends Contadores {
    // Chamada quando uma tela ganha foco (useBuscar)
    atualizar: () => void;
    // Usado pelo useMarcarVisita: a tela em foco grava a visita e continua "vista" enquanto estiver em foco
    registrarVisita: (sufixo: SufixoVisita) => () => void;
}

const ZERADOS: Contadores = { menu: {}, chatPorTutoria: {}, porTutoria: {}, avisosPorSala: {} };

// Sem provider (ex.: telas de login) tudo fica zerado e nada acende
const ContextoContadores = createContext<ValorContexto>({
    ...ZERADOS,
    atualizar: () => {},
    registrarVisita: () => () => {}
});

// Sufixos de "última visita" que existem nos dados recebidos.
// "notas" entra sempre no aluno: sem nota nenhuma ainda, a primeira lançada já precisa contar
function sufixosDosDados(area: AreaContador, dados: DadosContadores){
    const sufixos: SufixoVisita[] = dados.tutorias.map((tutoria) => `chat:${tutoria.id_tutoria}` as const);

    for(const sala of dados.avisos) sufixos.push(`avisos:${sala.id_sala}`);
    if(area === "aluno") sufixos.push("notas");

    return sufixos;
}

// Junta os contadores por status (já contados na busca) com os de "última visita" (AsyncStorage)
function calcular(area: AreaContador, idUsuario: string | null, dados: DadosContadores, visitas: Visitas): Contadores {
    // Sem id não dá para montar a chave: os contadores de última visita ficam zerados
    const desde = (sufixo: SufixoVisita) => idUsuario ? visitas[chaveVisita(area, idUsuario, sufixo)] : undefined;

    const avisosPorSala: Record<number, number> = {};
    let totalAvisos = 0;

    for(const sala of dados.avisos){
        avisosPorSala[sala.id_sala] = contarDepois(sala.datas, desde(`avisos:${sala.id_sala}`));
        totalAvisos += avisosPorSala[sala.id_sala];
    }

    const chatPorTutoria: Record<number, number> = {};
    const porTutoria: Record<number, number> = {};
    let totalChat = 0;

    for(const tutoria of dados.tutorias){
        chatPorTutoria[tutoria.id_tutoria] = contarDepois(tutoria.mensagens, desde(`chat:${tutoria.id_tutoria}`));
        porTutoria[tutoria.id_tutoria] = chatPorTutoria[tutoria.id_tutoria] + (avisosPorSala[tutoria.id_sala] ?? 0);
        totalChat += chatPorTutoria[tutoria.id_tutoria];
    }

    return {
        menu: {
            ...dados.status,
            desempenho: contarDepois(dados.notas, desde("notas")),
            tutoria: totalChat + totalAvisos
        },
        chatPorTutoria,
        porTutoria,
        avisosPorSala
    };
}

interface Props {
    area: AreaContador;
    children: ReactNode;
}

// Envolve as abas de cada área (arquivos de routes), como o layout de cada área no site.
// Busca os dados ao abrir a área, quando uma tela ganha foco e a cada 60 s (só com o app em primeiro plano).
// Header, abas e telas leem o mesmo resultado: nenhuma tela faz chamada extra para os contadores.
// Ao trocar de área ou sair, o provider desmonta: o intervalo para e os contadores somem da memória
export function ProvedorContadores({ area, children }: Props){
    const { user, conferirTutor } = useContext(AuthContext);
    // Mesmo id do "sub" do token, que o site usa na chave (id_aluno ou id_professor)
    const idUsuario = user.id ? String(user.id) : null;

    const [dados, setDados] = useState<DadosContadores | null>(null);
    // Datas de visita já lidas do AsyncStorage, em memória (a bolinha some na hora ao abrir a tela)
    const [visitas, setVisitas] = useState<Visitas>({});

    // Telas em foco agora (useMarcarVisita). O número é quantas vezes o mesmo sufixo está registrado
    const abertas = useRef(new Map<SufixoVisita, number>());
    // Só a resposta da busca mais recente vale; depois de desmontar, nenhuma vale
    const ultimaBusca = useRef(0);
    const inicioUltimaBusca = useRef(0);

    const buscar = useCallback(async () => {
        const numero = ++ultimaBusca.current;
        inicioUltimaBusca.current = Date.now();

        // Na área do aluno, aproveita a mesma hora para ver se o pedido de tutoria foi aceito
        // (na área do tutor, a revogação do vínculo já é tratada pelo interceptor do AuthContext)
        if(area === "aluno") conferirTutor();

        try {
            const resposta = await buscarDadosContadores(area);
            if(numero !== ultimaBusca.current) return;

            let novas: Visitas = {};

            if(idUsuario){
                const chave = (sufixo: SufixoVisita) => chaveVisita(area, idUsuario, sufixo);
                const chaves = sufixosDosDados(area, resposta).map(chave);
                const lidas = await lerVisitas(chaves);

                // Primeira vez de cada item: considera tudo como já visto.
                // Tela em foco continua vista: mensagem nova no chat aberto não acende a bolinha
                const gravar = new Set(chaves.filter((item) => lidas[item] === undefined));
                for(const sufixo of abertas.current.keys()) gravar.add(chave(sufixo));

                novas = { ...lidas, ...await gravarVisitas([...gravar]) };
            }

            if(numero !== ultimaBusca.current) return;

            setDados(resposta);
            setVisitas((anteriores) => ({ ...anteriores, ...novas }));
        } catch {
            // API fora ou sem conexão: mantém os últimos contadores, sem toast
        }
    }, [area, idUsuario, conferirTutor])

    // Foco de uma tela (equivale à troca de página do site) e abertura da área.
    // A tela em foco roda o efeito antes do provider: as duas chamadas viram uma busca só
    const atualizar = useCallback(() => {
        if(Date.now() - inicioUltimaBusca.current < MIN_ENTRE_BUSCAS) return;

        buscar();
    }, [buscar])

    // Ao abrir a área e a cada 60 s, só com o app em primeiro plano.
    // Indo para segundo plano o intervalo para; voltando, atualiza na hora e recomeça
    useEffect(() => {
        let intervalo: ReturnType<typeof setInterval> | null = null;

        function iniciar(){
            if(intervalo) return;

            intervalo = setInterval(() => {
                if(AppState.currentState === "active") buscar();
            }, INTERVALO);
        }

        function parar(){
            if(intervalo) clearInterval(intervalo);
            intervalo = null;
        }

        atualizar();
        if(AppState.currentState === "active") iniciar();

        const assinatura = AppState.addEventListener("change", (estado) => {
            if(estado === "active"){
                atualizar();
                iniciar();
            } else {
                parar();
            }
        });

        return () => {
            parar();
            assinatura.remove();
            // Uma busca em andamento não atualiza mais nada
            ultimaBusca.current++;
        }
    }, [buscar, atualizar])

    const registrarVisita = useCallback((sufixo: SufixoVisita) => {
        const mapa = abertas.current;
        mapa.set(sufixo, (mapa.get(sufixo) ?? 0) + 1);

        // Sem id, a visita é gravada na próxima busca (a tela continua no mapa de abertas)
        if(idUsuario){
            const chave = chaveVisita(area, idUsuario, sufixo);

            setVisitas((anteriores) => ({ ...anteriores, [chave]: Date.now() }));
            // Gravação em segundo plano; um erro não quebra a tela
            gravarVisitas([chave]);
        }

        return () => {
            const restantes = (mapa.get(sufixo) ?? 1) - 1;

            if(restantes <= 0) mapa.delete(sufixo);
            else mapa.set(sufixo, restantes);
        }
    }, [area, idUsuario])

    const contadores = useMemo(
        () => dados ? calcular(area, idUsuario, dados, visitas) : ZERADOS,
        [area, idUsuario, dados, visitas]
    )

    const valor = useMemo(
        () => ({ ...contadores, atualizar, registrarVisita }),
        [contadores, atualizar, registrarVisita]
    )

    return (
        <ContextoContadores.Provider value={valor}>
            {children}
        </ContextoContadores.Provider>
    )
}

export function useContadores(){
    return useContext(ContextoContadores);
}

// Equivale ao MarcarVisita do site: grava a "última visita" quando a tela ganha foco
// e a mantém em dia enquanto ela estiver em foco (as telas continuam montadas nas abas).
// null = ainda não dá para saber o sufixo (ex.: a sala só aparece depois de carregar a tutoria)
export function useMarcarVisita(sufixo: SufixoVisita | null){
    const { registrarVisita } = useContadores();

    useFocusEffect(
        useCallback(() => {
            if(!sufixo) return;

            return registrarVisita(sufixo);
        }, [sufixo, registrarVisita])
    )
}
