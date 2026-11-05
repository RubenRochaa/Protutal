"use client"

import styles from './styles.module.scss'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { handleReenviarConfirmacao } from '../../actions'

// Mesmo intervalo do back-end (ReenviarConfirmacaoEmailService): antes de 2 minutos
// ele ignora o pedido, então o botão fica bloqueado esse tempo
const ESPERA_REENVIO_S = 120

interface Props {
    texto: string;
    textoBotao: string;
}

// Aviso do login com o botão de reenviar o link de confirmação (rota O4).
// O e-mail usado é o que está digitado no formulário de login.
export function AvisoConfirmacao({ texto, textoBotao }: Props){
    const [enviando, startTransition] = useTransition();
    const [restante, setRestante] = useState(0);

    // Contagem regressiva depois de um envio: diminui 1 por segundo até zerar
    useEffect(() => {
        if(restante <= 0) return;

        const timer = setTimeout(() => setRestante(restante - 1), 1000);
        return () => clearTimeout(timer);
    }, [restante]);

    function handleClick(e: React.MouseEvent<HTMLButtonElement>){
        const form = e.currentTarget.form;
        const email = form ? String(new FormData(form).get("email") ?? "") : "";

        startTransition(async () => {
            const resultado = await handleReenviarConfirmacao(email);

            if(resultado.error){
                toast.error(resultado.error);
                return;
            }

            toast.success(resultado.sucesso);
            setRestante(ESPERA_REENVIO_S);
        });
    }

    const bloqueado = enviando || restante > 0;

    return (
        <div className={styles.aviso} role="status">
            <p>{texto}</p>

            <button type="button" onClick={handleClick} disabled={bloqueado} className={styles.botao}>
                {enviando ? "Enviando..." : restante > 0 ? `Reenviar em ${restante}s` : textoBotao}
            </button>
        </div>
    )
}
