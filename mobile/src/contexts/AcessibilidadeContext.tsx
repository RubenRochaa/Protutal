import React, { createContext, useCallback, useEffect, useMemo, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    CHAVE_ACESSIBILIDADE,
    NIVEIS_FONTE,
    PREFERENCIAS_PADRAO,
    Preferencias,
} from "../styles/theme";

export interface AcessibilidadeContextData extends Preferencias {
    // false enquanto lê o AsyncStorage: o App segura a tela de carregamento até ficar true
    carregado: boolean;
    aumentarFonte: () => void;
    diminuirFonte: () => void;
    restaurarFonte: () => void;
    alternarTema: () => void;
    alternarDaltonico: () => void;
}

export const AcessibilidadeContext = createContext({} as AcessibilidadeContextData);

// Lê o que estiver salvo e ignora qualquer valor fora do esperado (mesma ideia do script do site)
function lerPreferencias(texto: string | null): Preferencias {
    if(!texto) return PREFERENCIAS_PADRAO;

    try{
        const salvo = JSON.parse(texto);
        const nivelValido = Number.isInteger(salvo?.nivelFonte) && salvo.nivelFonte >= 0 && salvo.nivelFonte < NIVEIS_FONTE.length;

        return {
            nivelFonte: nivelValido ? salvo.nivelFonte : PREFERENCIAS_PADRAO.nivelFonte,
            tema: salvo?.tema === "escuro" ? "escuro" : "claro",
            daltonico: salvo?.daltonico === true,
        };
    }catch{
        return PREFERENCIAS_PADRAO;
    }
}

// Vale também antes do login (telas públicas), por isso fica fora do AuthProvider
export function AcessibilidadeProvider({ children }: { children: ReactNode }){
    const [preferencias, setPreferencias] = useState<Preferencias>(PREFERENCIAS_PADRAO);
    const [carregado, setCarregado] = useState(false);

    useEffect(() => {
        let ativo = true;

        async function carregar(){
            try{
                const texto = await AsyncStorage.getItem(CHAVE_ACESSIBILIDADE);
                if(ativo) setPreferencias(lerPreferencias(texto));
            }catch{
                // Erro de leitura: segue com o padrão, o app não quebra
            }finally{
                if(ativo) setCarregado(true);
            }
        }

        carregar();
        return () => { ativo = false };
    }, []);

    // Atualiza o estado e grava; erro de gravação só significa que a escolha não persiste
    const atualizar = useCallback((mudar: (atual: Preferencias) => Preferencias) => {
        setPreferencias((atual) => {
            const novo = mudar(atual);
            AsyncStorage.setItem(CHAVE_ACESSIBILIDADE, JSON.stringify(novo)).catch(() => {});
            return novo;
        });
    }, []);

    const aumentarFonte = useCallback(() => {
        atualizar((p) => ({ ...p, nivelFonte: Math.min(p.nivelFonte + 1, NIVEIS_FONTE.length - 1) }));
    }, [atualizar]);

    const diminuirFonte = useCallback(() => {
        atualizar((p) => ({ ...p, nivelFonte: Math.max(p.nivelFonte - 1, 0) }));
    }, [atualizar]);

    const restaurarFonte = useCallback(() => {
        atualizar((p) => ({ ...p, nivelFonte: PREFERENCIAS_PADRAO.nivelFonte }));
    }, [atualizar]);

    const alternarTema = useCallback(() => {
        atualizar((p) => ({ ...p, tema: p.tema === "escuro" ? "claro" : "escuro" }));
    }, [atualizar]);

    const alternarDaltonico = useCallback(() => {
        atualizar((p) => ({ ...p, daltonico: !p.daltonico }));
    }, [atualizar]);

    const valor = useMemo(() => ({
        ...preferencias,
        carregado,
        aumentarFonte,
        diminuirFonte,
        restaurarFonte,
        alternarTema,
        alternarDaltonico,
    }), [preferencias, carregado, aumentarFonte, diminuirFonte, restaurarFonte, alternarTema, alternarDaltonico]);

    return (
        <AcessibilidadeContext.Provider value={valor}>
            {children}
        </AcessibilidadeContext.Provider>
    );
}
