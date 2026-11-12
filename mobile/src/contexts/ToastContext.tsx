import React, { createContext, MutableRefObject, ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Toast, ToastType } from "../components/Toast";

type ToastContextData = {
    showToast: (type: ToastType, message: string) => void;
}

type ToastProviderProps = {
    children: ReactNode;
}

type ToastState = {
    // Muda a cada aviso novo: é o que faz a animação de entrada rodar de novo
    id: number;
    type: ToastType;
    message: string;
}

// Estado interno, lido só pelo ToastHost (as telas continuam usando apenas o showToast)
type ToastEstadoData = {
    toast: ToastState | null;
    // true durante a animação de saída
    saindo: boolean;
    fechar: () => void;
    // Ids dos hosts dos modais abertos, na ordem em que abriram (o último é o de cima)
    pilha: number[];
    registrar: (idHost: number) => void;
    remover: (idHost: number) => void;
    // Id do último aviso que já fez a animação de entrada (para não repetir ao trocar de host)
    jaMostrado: MutableRefObject<number | null>;
}

// Tempo que o aviso fica na tela antes de sumir sozinho
const DURACAO_MS = 4000;

// Duração das animações de entrada e de saída
const ENTRADA_MS = 200;
const SAIDA_MS = 150;

export const ToastContext = createContext({} as ToastContextData);

const ToastEstadoContext = createContext({} as ToastEstadoData);

// Contador que dá um id fixo para cada host
let proximoHostId = 1;

// Mostra um aviso por vez, no topo da tela (equivale ao toast.success / toast.error do site).
// Se chegar um aviso novo, ele substitui o anterior.
// Uso: const { showToast } = useContext(ToastContext); showToast("erro", "mensagem")
export function ToastProvider({ children }: ToastProviderProps){
    const [toast, setToast] = useState<ToastState | null>(null);
    const [saindo, setSaindo] = useState(false);
    const [pilha, setPilha] = useState<number[]>([]);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timerSaida = useRef<ReturnType<typeof setTimeout> | null>(null);
    const proximoId = useRef(1);
    const jaMostrado = useRef<number | null>(null);

    const limparTimers = useCallback(() => {
        if(timer.current) clearTimeout(timer.current);
        if(timerSaida.current) clearTimeout(timerSaida.current);
    }, [])

    // Roda a animação de saída e só depois tira o aviso da tela
    const fechar = useCallback(() => {
        limparTimers();
        setSaindo(true);

        timerSaida.current = setTimeout(() => {
            setToast(null);
            setSaindo(false);
        }, SAIDA_MS);
    }, [limparTimers])

    const showToast = useCallback((type: ToastType, message: string) => {
        limparTimers();

        setToast({ id: proximoId.current++, type, message });
        setSaindo(false);
        timer.current = setTimeout(fechar, DURACAO_MS);
    }, [limparTimers, fechar])

    const registrar = useCallback((idHost: number) => {
        setPilha((atual) => atual.includes(idHost) ? atual : [...atual, idHost]);
    }, [])

    const remover = useCallback((idHost: number) => {
        setPilha((atual) => atual.filter((id) => id !== idHost));
    }, [])

    // Limpa os timers se o app fechar com um aviso aberto
    useEffect(() => limparTimers, [limparTimers]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            <ToastEstadoContext.Provider value={{ toast, saindo, fechar, pilha, registrar, remover, jaMostrado }}>
                {children}

                <ToastHost raiz />
            </ToastEstadoContext.Provider>
        </ToastContext.Provider>
    )
}

interface ToastHostProps {
    // Visibilidade do modal onde o host está: fechado = sai da pilha
    ativo?: boolean;
    // Só o host do ToastProvider: fica fora da pilha e mostra o aviso quando nenhum modal está aberto
    raiz?: boolean;
}

// Lugar onde o aviso é desenhado. Um fica na raiz do app (acima das telas, Header e abas)
// e outro vai dentro de cada <Modal>: no Android o Modal abre uma janela nativa separada,
// por cima de tudo, então o aviso precisa ser desenhado dentro dela para aparecer na frente.
// Para não duplicar, só o host de cima mostra o aviso: o do último modal aberto ou, sem modal, o da raiz
export function ToastHost({ ativo = true, raiz = false }: ToastHostProps){
    const { toast, saindo, fechar, pilha, registrar, remover, jaMostrado } = useContext(ToastEstadoContext);
    const insets = useSafeAreaInsets();
    const [idHost] = useState(() => proximoHostId++);
    // 0 = escondido (acima e transparente), 1 = na posição final
    const animacao = useRef(new Animated.Value(0)).current;

    // Entra na pilha quando o modal abre; sai quando fecha ou desmonta
    useEffect(() => {
        if(raiz || !ativo) return;

        registrar(idHost);
        return () => remover(idHost);
    }, [raiz, ativo, idHost, registrar, remover])

    const ehTopo = raiz ? pilha.length === 0 : ativo && pilha[pilha.length - 1] === idHost;
    const id = toast?.id;

    // useLayoutEffect: ajusta a animação antes de desenhar, para o aviso não piscar ao trocar de host
    useLayoutEffect(() => {
        if(id === undefined || !ehTopo) return;

        if(saindo){
            Animated.timing(animacao, { toValue: 0, duration: SAIDA_MS, useNativeDriver: true }).start();
        } else if(jaMostrado.current === id){
            // Aviso que já estava na tela (ex.: o modal fechou): continua parado no lugar
            animacao.setValue(1);
        } else {
            jaMostrado.current = id;
            animacao.setValue(0);
            Animated.timing(animacao, { toValue: 1, duration: ENTRADA_MS, useNativeDriver: true }).start();
        }
    }, [id, saindo, ehTopo, animacao, jaMostrado])

    if(!toast || !ehTopo) return null;

    return (
        // Logo abaixo da barra de status. box-none: o resto da tela continua recebendo os toques
        <Animated.View
        pointerEvents="box-none"
        style={[
            styles.area,
            {
                top: insets.top + 8,
                opacity: animacao,
                transform: [{ translateY: animacao.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
            }
        ]}
        >
            <Toast type={toast.type} message={toast.message} onClose={fechar} />
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    area:{
        position: "absolute",
        left: 16,
        right: 16,
        // Acima do Header, das abas e do conteúdo da mesma janela
        zIndex: 1000,
        elevation: 1000
    }
})
