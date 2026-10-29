"use client"

import styles from './styles.module.scss'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/errorState'

interface Props {
    mensagem: string;
}

// A busca da lista falhou no servidor (ex.: API desligada).
// Mostra o toast com a mensagem e o quadro com "Tentar novamente" (busca de novo na API).
export function ErroCarregamento({ mensagem }: Props){
    useEffect(() => {
        // O id evita toast repetido quando o efeito roda mais de uma vez
        toast.error(mensagem, { id: "erro-carregamento" });
    }, [mensagem]);

    return (
        <div className={styles.erro}>
            <ErrorState mensagem={mensagem} />
        </div>
    )
}
