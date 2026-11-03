"use client"

import styles from './styles.module.scss'
import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/modal'
import { Button } from '@/components/button'
import { handlePedirTutoria } from '../../actions'

interface Props {
    idSala: number;
    nomeSala: string;
}

interface FormProps extends Props {
    onFechar: () => void;
}

// Confirmação dentro do modal: um formulário só com o id da sala
function FormConfirmacao({ idSala, nomeSala, onFechar }: FormProps){
    const [estado, formAction] = useActionState(handlePedirTutoria, {});

    useEffect(() => {
        if(estado.error) toast.error(estado.error);

        if(estado.sucesso){
            toast.success(estado.sucesso);
            onFechar();
        }
    }, [estado, onFechar]);

    return (
        <form action={formAction} className={styles.form}>
            <input type="hidden" name="id_sala" value={idSala} />

            <p>
                Você vai pedir para ser tutor na sala <strong>{nomeSala}</strong>.
                O professor da sala vai analisar seu pedido.
            </p>

            <div className={styles.botoes}>
                <button type="button" onClick={onFechar} className={styles.cancelar}>Cancelar</button>
                <div className={styles.enviar}>
                    <Button name="Confirmar pedido" nameCarregando="Enviando..." />
                </div>
            </div>
        </form>
    )
}

// Botão "Pedir para ser tutor" e o modal de confirmação (rota A13, pela Server Action)
export function BotaoPedirTutoria(props: Props){
    const [aberto, setAberto] = useState(false);

    // Mesma função a cada render: o useEffect do formulário não repete o toast quando a página atualiza
    const fechar = useCallback(() => setAberto(false), []);

    return (
        <>
            <button type="button" onClick={() => setAberto(true)} className={styles.botao}>
                Pedir para ser tutor
            </button>

            {/* Só existe enquanto aberto: não fica um <dialog> por sala na página */}
            {aberto && (
                <Modal aberto onFechar={fechar} titulo="Pedir para ser tutor">
                    <FormConfirmacao {...props} onFechar={fechar} />
                </Modal>
            )}
        </>
    )
}
