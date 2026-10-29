"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'sonner'

interface Props {
    mensagem: string;
}

// A P1 recusou a sala: não existe (404), é de outro professor (403) ou o id é inválido (400).
// Mostra a mensagem da API no toast e no quadro, com o caminho de volta para "Minhas salas".
export function SalaIndisponivel({ mensagem }: Props){
    useEffect(() => {
        // O id evita toast repetido quando o efeito roda mais de uma vez
        toast.error(mensagem, { id: "sala-indisponivel" });
    }, [mensagem]);

    return (
        <div className={styles.quadro} role="alert">
            <p className={styles.mensagem}>{mensagem}</p>

            <Link href="/professor#salas" className={styles.botao}>
                Voltar para Minhas salas
            </Link>
        </div>
    )
}
