"use client"

import styles from './styles.module.scss'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Loader } from '@/components/loader'

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
            {/* Enquanto atualiza, o Loader toma o lugar do ícone */}
            {carregando ? <Loader size="pequeno" decorativo /> : <RefreshCw size={18} aria-hidden="true" />}
            {carregando ? "Atualizando..." : "Atualizar"}
        </button>
    )
}
