"use client"

import styles from './styles.module.scss'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MSG_SEM_CONEXAO } from '@/lib/getErrorMessage'
import { ImagemMascote, MASCOTES } from '@/lib/mascotes'
import { Loader } from '../loader'
import { Mascote } from '../mascote'

interface Props {
    mensagem?: string;
    retry?: () => void;
    // Mascote acima do texto. Padrão: mascote com o papel com X (badRequest); null = sem imagem
    imagem?: ImagemMascote | null;
}

// Erro de conexão: quadro branco com o mascote, a mensagem e o botão "Tentar novamente".
// Sem "retry": recarrega os dados da página (os Server Components buscam de novo na API).
// No error.tsx da rota, passe o retry que o Next entrega: <ErrorState retry={retry} />
export function ErrorState({ mensagem = MSG_SEM_CONEXAO, retry, imagem = MASCOTES.badRequest }: Props){
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
            {imagem && <Mascote imagem={imagem} className={styles.imagem} />}
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
