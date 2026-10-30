"use client"

import styles from './styles.module.scss'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MSG_SEM_CONEXAO } from '@/lib/getErrorMessage'
import { Loader } from '../loader'

interface Props {
    mensagem?: string;
    retry?: () => void;
}

// Erro de conexão: quadro branco com a mensagem e o botão "Tentar novamente".
// Sem "retry": recarrega os dados da página (os Server Components buscam de novo na API).
// No error.tsx da rota, passe o retry que o Next entrega: <ErrorState retry={retry} />
export function ErrorState({ mensagem = MSG_SEM_CONEXAO, retry }: Props){
    const router = useRouter();
    const [carregando, startTransition] = useTransition();

    function handleTentarNovamente(){
        startTransition(() => {
            if(retry) retry();
            else router.refresh();
        });
    }

    return (
        <div className={styles.quadro} role="alert">
            <p className={styles.mensagem}>{mensagem}</p>

            <button
            type="button"
            onClick={handleTentarNovamente}
            disabled={carregando}
            className={styles.botao}
            >
                {carregando && <Loader size="pequeno" variant="branco" decorativo />}
                {carregando ? "Carregando..." : "Tentar novamente"}
            </button>
        </div>
    )
}
