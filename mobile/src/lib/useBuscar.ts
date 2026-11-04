import { useCallback, useContext, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { ToastContext } from "../contexts/ToastContext";
import { getErrorMessage, getErrorStatus } from "./getErrorMessage";

interface Opcoes {
    // Status que são um estado da tela e não falha (ex.: 404 = "não encontrada"): sem toast
    semToast?: number[];
}

// Busca os dados de uma tela na API e controla os estados de carregando, atualizando e erro.
// Busca de novo sempre que a tela volta a ficar visível (ex.: depois de enviar uma resposta),
// sem esconder o que já está na tela. "buscar" deve vir de um useCallback.
export function useBuscar<T>(buscar: () => Promise<T>, { semToast = [] }: Opcoes = {}){
    const { showToast } = useContext(ToastContext);

    const [dados, setDados] = useState<T | null>(null);
    const [erro, setErro] = useState<unknown>(null);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);

    // Só a resposta da busca mais recente vale (ex.: trocou o filtro antes da anterior voltar)
    const ultimaBusca = useRef(0);
    const semToastRef = useRef(semToast);
    semToastRef.current = semToast;

    const executar = useCallback(async (modo: "inicial" | "puxar" | "foco") => {
        const id = ++ultimaBusca.current;

        if(modo === "inicial") setCarregando(true);
        if(modo === "puxar") setAtualizando(true);

        try {
            const resultado = await buscar();
            if(id !== ultimaBusca.current) return;

            setDados(resultado);
            setErro(null);
        } catch(err) {
            if(id !== ultimaBusca.current) return;

            const status = getErrorStatus(err);

            // 401 o AuthContext já trata (desloga e avisa)
            if(status !== 401 && !(status !== null && semToastRef.current.includes(status))){
                showToast("erro", getErrorMessage(err));
            }

            setErro(err);
        } finally {
            if(id === ultimaBusca.current){
                setCarregando(false);
                setAtualizando(false);
            }
        }
    }, [buscar, showToast])

    // Primeira vez: Loader. Voltando para a tela: atualiza sem Loader
    const jaBuscou = useRef(false);
    const buscarAnterior = useRef(buscar);

    useFocusEffect(
        useCallback(() => {
            // Trocou o filtro (buscar mudou): mostra o Loader de novo
            const mudouBusca = buscarAnterior.current !== buscar;
            buscarAnterior.current = buscar;

            executar(jaBuscou.current && !mudouBusca ? "foco" : "inicial");
            jaBuscou.current = true;
        }, [buscar, executar])
    )

    return {
        dados,
        erro,
        carregando,
        atualizando,
        // Puxar para atualizar
        atualizar: () => executar("puxar"),
        // Botão "Tentar novamente"
        tentarNovamente: () => executar("inicial"),
    }
}
