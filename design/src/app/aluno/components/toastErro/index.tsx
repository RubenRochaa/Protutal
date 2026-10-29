"use client"

import { useEffect } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/errorState'

interface Props {
    mensagem: string;
}

// A busca de um card falhou no servidor (ex.: API desligada).
// Mostra o toast com a mensagem e o quadro com "Tentar novamente" (busca de novo na API).
export function ToastErro({ mensagem }: Props){
    useEffect(() => {
        // Mesmo id em todos os cards: com a API fora, aparece um toast só, e não três
        toast.error(mensagem, { id: "erro-inicio-aluno" });
    }, [mensagem]);

    return <ErrorState mensagem={mensagem} />
}
