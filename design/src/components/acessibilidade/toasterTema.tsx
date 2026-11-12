"use client"

import { Toaster } from 'sonner'
import { useAcessibilidade } from '@/lib/acessibilidade'

// Toaster do sonner com o tema do painel de Acessibilidade.
// As cores de sucesso do modo daltônico ficam no globals.scss (variáveis do sonner)
export function ToasterTema(){
    const { tema } = useAcessibilidade()

    return (
        <Toaster
        position="bottom-right"
        richColors
        closeButton
        theme={tema === "escuro" ? "dark" : "light"}
        />
    )
}
