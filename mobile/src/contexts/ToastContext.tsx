import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
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
}

// Tempo que o aviso fica na tela antes de sumir sozinho
const DURACAO_MS = 4000;

// Duração das animações de entrada e de saída
const ENTRADA_MS = 200;
const SAIDA_MS = 150;

export const ToastContext = createContext({} as ToastContextData);

const ToastEstadoContext = createContext<ToastEstadoData>({ toast: null, saindo: false, fechar: () => {} });

// Mostra um aviso por vez, no topo da tela (equivale ao toast.success / toast.error do site).
// Se chegar um aviso novo, ele substitui o anterior.
// Uso: const { showToast } = useContext(ToastContext); showToast("erro", "mensagem")
export function ToastProvider({ children }: ToastProviderProps){
    const [toast, setToast] = useState<ToastState | null>(null);
    const [saindo, setSaindo] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timerSaida = useRef<ReturnType<typeof setTimeout> | null>(null);
    const proximoId = useRef(1);

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

    // Limpa os timers se o app fechar com um aviso aberto
    useEffect(() => limparTimers, [limparTimers]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            <ToastEstadoContext.Provider value={{ toast, saindo, fechar }}>
                {children}

                <ToastHost />
            </ToastEstadoContext.Provider>
        </ToastContext.Provider>
    )
}

// Lugar onde o aviso é desenhado. Um fica na raiz do app (acima das telas, Header e abas)
// e outro vai dentro de cada <Modal>: no Android o Modal abre uma janela nativa separada,
// por cima de tudo, então o aviso precisa ser desenhado dentro dela para aparecer na frente.
// Todos mostram o mesmo aviso ao mesmo tempo, no mesmo lugar
export function ToastHost(){
    const { toast, saindo, fechar } = useContext(ToastEstadoContext);
    const insets = useSafeAreaInsets();
    // 0 = escondido (acima e transparente), 1 = na posição final
    const animacao = useRef(new Animated.Value(0)).current;

    const id = toast?.id;

    useEffect(() => {
        if(id === undefined) return;

        if(saindo){
            Animated.timing(animacao, { toValue: 0, duration: SAIDA_MS, useNativeDriver: true }).start();
        } else {
            animacao.setValue(0);
            Animated.timing(animacao, { toValue: 1, duration: ENTRADA_MS, useNativeDriver: true }).start();
        }
    }, [id, saindo, animacao])

    if(!toast) return null;

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
