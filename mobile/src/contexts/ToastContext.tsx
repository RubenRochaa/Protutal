import React, { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Toast, ToastType } from "../components/Toast";

type ToastContextData = {
    showToast: (type: ToastType, message: string) => void;
}

type ToastProviderProps = {
    children: ReactNode;
}

type ToastState = {
    type: ToastType;
    message: string;
}

// Tempo que o aviso fica na tela antes de sumir sozinho
const DURACAO_MS = 4000;

export const ToastContext = createContext({} as ToastContextData);

// Mostra um aviso por vez, embaixo da tela (equivale ao toast.success / toast.error do site).
// Uso: const { showToast } = useContext(ToastContext); showToast("erro", "mensagem")
export function ToastProvider({ children }: ToastProviderProps){
    const [toast, setToast] = useState<ToastState | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const insets = useSafeAreaInsets();

    const fechar = useCallback(() => {
        if(timer.current) clearTimeout(timer.current);
        setToast(null);
    }, [])

    const showToast = useCallback((type: ToastType, message: string) => {
        if(timer.current) clearTimeout(timer.current);

        setToast({ type, message });
        timer.current = setTimeout(() => setToast(null), DURACAO_MS);
    }, [])

    // Limpa o timer se o app fechar com um aviso aberto
    useEffect(() => fechar, [fechar]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {toast && (
                // Fica acima da barra de abas (por isso o bottom maior)
                <View style={[styles.area, { bottom: insets.bottom + 72 }]} pointerEvents="box-none">
                    <Toast type={toast.type} message={toast.message} onClose={fechar} />
                </View>
            )}
        </ToastContext.Provider>
    )
}

const styles = StyleSheet.create({
    area:{
        position: "absolute",
        left: 16,
        right: 16
    }
})
