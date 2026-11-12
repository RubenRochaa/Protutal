import { useContext, useMemo } from "react";

import { AcessibilidadeContext } from "../contexts/AcessibilidadeContext";
import { criarCores, escalar, escalarFontes, NIVEIS_FONTE } from "../styles/theme";

// Devolve o tema atual: cores (claro/escuro/daltônico) e tamanhos de fonte já multiplicados
// pelo nível escolhido. Use junto com useMemo: const styles = useMemo(() => makeStyles(t), [t])
export function useTema(){
    const { tema, daltonico, nivelFonte } = useContext(AcessibilidadeContext);

    return useMemo(() => ({
        tema,
        daltonico,
        nivelFonte,
        percentual: NIVEIS_FONTE[nivelFonte],
        colors: criarCores(tema, daltonico),
        fontSizes: escalarFontes(nivelFonte),
        // Para os tamanhos de fonte e alturas de linha escritos como número na tela
        fs: (valor: number) => escalar(valor, nivelFonte),
    }), [tema, daltonico, nivelFonte]);
}

export type TemaAtual = ReturnType<typeof useTema>;
