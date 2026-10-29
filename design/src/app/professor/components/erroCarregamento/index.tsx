"use client"

import styles from './styles.module.scss'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/errorState'
import { EmptyState } from '@/components/emptyState'

interface Props {
    mensagem: string;
    // Status HTTP do erro (null = sem resposta da API).
    // 400, 403 e 404 são recusas da API: tentar de novo não resolve, então não há botão
    status?: number | null;
}

const RECUSAS = [400, 403, 404]

// A busca falhou no servidor (ex.: API desligada, ou atividade de outro professor).
// Mostra o toast com a mensagem e o quadro: com "Tentar novamente" (busca de novo na API)
// ou, se a API recusou, só a mensagem.
export function ErroCarregamento({ mensagem, status = null }: Props){
    useEffect(() => {
        // O id evita toast repetido quando o efeito roda mais de uma vez
        toast.error(mensagem, { id: "erro-carregamento" });
    }, [mensagem]);

    const recusa = status !== null && RECUSAS.includes(status)

    return (
        <div className={styles.erro}>
            {recusa ? <EmptyState mensagem={mensagem} /> : <ErrorState mensagem={mensagem} />}
        </div>
    )
}
