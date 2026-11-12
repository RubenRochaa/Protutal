"use client"

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
    CHAVE_ACESSIBILIDADE,
    NIVEIS_FONTE,
    NIVEL_FONTE_PADRAO,
    PREFERENCIAS_PADRAO,
    PreferenciasAcessibilidade,
    Tema,
} from './acessibilidadeConfig'

interface ValorContexto extends PreferenciasAcessibilidade {
    aumentarFonte: () => void;
    diminuirFonte: () => void;
    restaurarFonte: () => void;
    alternarTema: () => void;
    alternarDaltonico: () => void;
}

const ContextoAcessibilidade = createContext<ValorContexto>({
    ...PREFERENCIAS_PADRAO,
    aumentarFonte: () => {},
    diminuirFonte: () => {},
    restaurarFonte: () => {},
    alternarTema: () => {},
    alternarDaltonico: () => {},
})

// Lê o que o script do <head> já aplicou no <html> (ele leu o localStorage antes da página aparecer)
function lerDoHtml(): PreferenciasAcessibilidade {
    const html = document.documentElement
    const fonte = Number(html.getAttribute("data-fonte"))
    const indice = NIVEIS_FONTE.findIndex((nivel) => nivel === fonte)

    return {
        nivelFonte: indice >= 0 ? indice : NIVEL_FONTE_PADRAO,
        tema: html.getAttribute("data-tema") === "escuro" ? "escuro" : "claro",
        daltonico: html.getAttribute("data-daltonico") === "true",
    }
}

// Grava as escolhas no <html> (o CSS do globals.scss reage aos atributos)
function aplicarNoHtml(preferencias: PreferenciasAcessibilidade){
    const html = document.documentElement

    if(preferencias.tema === "escuro") html.setAttribute("data-tema", "escuro")
    else html.removeAttribute("data-tema")

    if(preferencias.daltonico) html.setAttribute("data-daltonico", "true")
    else html.removeAttribute("data-daltonico")

    if(preferencias.nivelFonte === NIVEL_FONTE_PADRAO) html.removeAttribute("data-fonte")
    else html.setAttribute("data-fonte", String(NIVEIS_FONTE[preferencias.nivelFonte]))
}

function salvar(preferencias: PreferenciasAcessibilidade){
    try {
        localStorage.setItem(CHAVE_ACESSIBILIDADE, JSON.stringify(preferencias))
    } catch {
        // Sem localStorage (bloqueado): a escolha vale só até recarregar a página
    }
}

// Guarda o tamanho da fonte, o tema e o modo daltônico do navegador.
// Fica no layout raiz: vale para todas as telas, inclusive antes do login
export function ProvedorAcessibilidade({ children }: { children: React.ReactNode }){
    const [preferencias, setPreferencias] = useState<PreferenciasAcessibilidade>(PREFERENCIAS_PADRAO)

    // No servidor não existe <html> para ler: o estado real chega depois de montar
    useEffect(() => {
        setPreferencias(lerDoHtml())
    }, [])

    const atualizar = useCallback((mudar: (atual: PreferenciasAcessibilidade) => PreferenciasAcessibilidade) => {
        setPreferencias((atual) => {
            const nova = mudar(atual)
            aplicarNoHtml(nova)
            salvar(nova)
            return nova
        })
    }, [])

    const valor: ValorContexto = {
        ...preferencias,
        aumentarFonte: () => atualizar((p) => ({ ...p, nivelFonte: Math.min(p.nivelFonte + 1, NIVEIS_FONTE.length - 1) })),
        diminuirFonte: () => atualizar((p) => ({ ...p, nivelFonte: Math.max(p.nivelFonte - 1, 0) })),
        restaurarFonte: () => atualizar((p) => ({ ...p, nivelFonte: NIVEL_FONTE_PADRAO })),
        alternarTema: () => atualizar((p) => ({ ...p, tema: (p.tema === "escuro" ? "claro" : "escuro") as Tema })),
        alternarDaltonico: () => atualizar((p) => ({ ...p, daltonico: !p.daltonico })),
    }

    return (
        <ContextoAcessibilidade.Provider value={valor}>
            {children}
        </ContextoAcessibilidade.Provider>
    )
}

export function useAcessibilidade(){
    return useContext(ContextoAcessibilidade)
}
