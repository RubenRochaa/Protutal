"use client"

import styles from './styles.module.scss'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

// Busca as mensagens de novo na API (os Server Components rodam outra vez).
// Não há polling nem websocket: o aluno atualiza quando quiser
export function BotaoAtualizar(){
    const router = useRouter();
    const [carregando, startTransition] = useTransition();

    function handleAtualizar(){
        startTransition(() => router.refresh());
    }

    return (
        <button type="button" onClick={handleAtualizar} disabled={carregando} className={styles.botao}>
            <RefreshCw size={18} aria-hidden="true" className={carregando ? styles.girando : undefined} />
            {carregando ? "Atualizando..." : "Atualizar"}
        </button>
    )
}
