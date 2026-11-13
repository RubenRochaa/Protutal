"use client"

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react'
import { Toaster } from 'sonner'
import { useAcessibilidade } from '@/lib/acessibilidade'

// O <dialog> do Modal fica na "top layer" do navegador, acima de qualquer z-index.
// Por isso o toast precisa ser desenhado DENTRO do modal quando ele está aberto.
// O sonner mostra todo toast em todo <Toaster> montado, então só um host pode ficar visível:
// guardamos a pilha de modais abertos; só o do topo mostra o toast (sem modal, o do layout).
interface PilhaToast {
    pilha: string[];
    abrir: (id: string) => void;
    fechar: (id: string) => void;
}

const PilhaToastContext = createContext<PilhaToast | null>(null)

export function ProvedorToast({ children }: { children: React.ReactNode }){
    const [pilha, setPilha] = useState<string[]>([])

    const abrir = useCallback((id: string) => setPilha(p => p.includes(id) ? p : [...p, id]), [])
    const fechar = useCallback((id: string) => setPilha(p => p.filter(x => x !== id)), [])

    const valor = useMemo(() => ({ pilha, abrir, fechar }), [pilha, abrir, fechar])

    return <PilhaToastContext.Provider value={valor}>{children}</PilhaToastContext.Provider>
}

// Toaster do sonner com o tema do painel de Acessibilidade.
// As cores de sucesso do modo daltônico ficam no globals.scss (variáveis do sonner)
function ToasterBase({ className }: { className?: string }){
    const { tema } = useAcessibilidade()

    return (
        <Toaster
        position="top-center"
        richColors
        closeButton
        theme={tema === "escuro" ? "dark" : "light"}
        className={className}
        />
    )
}

// Host do layout: continua montado (guarda o toast e o tempo dele), mas fica invisível
// enquanto houver modal aberto. Ao fechar o modal, o toast ainda ativo reaparece aqui, uma vez só.
export function ToasterTema(){
    const ctx = useContext(PilhaToastContext)
    const oculto = !!ctx && ctx.pilha.length > 0

    return <ToasterBase className={oculto ? "toaster-oculto" : undefined} />
}

// Host do modal: vai dentro do <dialog>. Registra o modal na pilha enquanto está aberto
// e só aparece se for o modal do topo (modal dentro de modal).
export function ToasterModal({ aberto }: { aberto: boolean }){
    const ctx = useContext(PilhaToastContext)
    const id = useId()
    const abrir = ctx?.abrir
    const fechar = ctx?.fechar

    useEffect(() => {
        if(!aberto || !abrir || !fechar) return
        abrir(id)
        return () => fechar(id)
    }, [aberto, id, abrir, fechar])

    if(!aberto || !ctx || ctx.pilha[ctx.pilha.length - 1] !== id) return null

    return <ToasterBase />
}
