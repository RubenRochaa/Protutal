"use client"

import styles from './styles.module.scss'
import { Modal } from '../modal'
import { Loader } from '../loader'

interface Props {
    aberto: boolean;
    titulo: string;
    // Texto que explica o que vai acontecer (ex.: "O histórico deste tutor não passa para um novo tutor.")
    mensagem: React.ReactNode;
    textoConfirmar: string;
    textoCancelar?: string;
    // true enquanto a ação roda no servidor: os botões ficam desabilitados
    pendente?: boolean;
    onConfirmar: () => void;
    onFechar: () => void;
    // Campos extras dentro da janela (ex.: justificativa ou nova nota)
    children?: React.ReactNode;
}

// Janela de confirmação para ações difíceis de desfazer (recusar, revogar, finalizar...).
// Só chama a API quando o usuário clica em confirmar. Quem usa controla o estado e a chamada.
export function ConfirmDialog({
    aberto, titulo, mensagem, textoConfirmar, textoCancelar = "Cancelar",
    pendente = false, onConfirmar, onFechar, children
}: Props){
    // Enquanto envia, fechar a janela esconderia o resultado: Esc e fundo são ignorados
    function handleFechar(){
        if(!pendente) onFechar();
    }

    return (
        <Modal
        aberto={aberto}
        onFechar={handleFechar}
        titulo={titulo}
        acoes={
            <>
                <button type="button" className={styles.cancelar} onClick={handleFechar} disabled={pendente}>
                    {textoCancelar}
                </button>
                <button type="button" className={styles.confirmar} onClick={onConfirmar} disabled={pendente}>
                    {pendente && <Loader size="pequeno" variant="branco" decorativo />}
                    {pendente ? "Enviando..." : textoConfirmar}
                </button>
            </>
        }
        >
            <div className={styles.corpo}>
                <p className={styles.mensagem}>{mensagem}</p>
                {children}
            </div>
        </Modal>
    )
}
