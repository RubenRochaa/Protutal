"use client"

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Sala } from '@/lib/types'
import { Botao } from '@/components/botao'
import { ModalAviso } from '../../../components/modalAviso'

interface Props {
    // Salas do professor (P20), para o select do modal
    salas: Sala[];
}

// Botão "Mandar notificação" da p08: abre o modal de aviso (p02) com o select de sala
export function MandarNotificacao({ salas }: Props){
    const [aberto, setAberto] = useState(false);

    return (
        <>
            <Botao onClick={() => setAberto(true)} disabled={salas.length === 0}>
                <Send size={18} aria-hidden="true" />
                Mandar notificação
            </Botao>

            <ModalAviso aberto={aberto} onFechar={() => setAberto(false)} salas={salas} />
        </>
    )
}
