"use client"

import styles from './styles.module.scss'
import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
    aberto: boolean;
    onFechar: () => void;
    titulo: string;
    children: React.ReactNode;
    // Botões do rodapé (opcional), alinhados à direita. Ex.: Cancelar e Confirmar
    acoes?: React.ReactNode;
}

// Janela branca sobre o fundo escurecido (print "Permissões como tutor").
// Usa o <dialog> nativo: ele já escurece o fundo, prende o foco dentro da janela e trata o Esc.
// Quem usa controla o estado: <Modal aberto={aberto} onFechar={() => setAberto(false)} ...>
export function Modal({ aberto, onFechar, titulo, children, acoes }: Props){
    const dialogRef = useRef<HTMLDialogElement>(null);
    // Id único: duas janelas na mesma tela não podem ter o mesmo id de título
    const tituloId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if(!dialog) return;

        if(aberto && !dialog.open) dialog.showModal();
        if(!aberto && dialog.open) dialog.close();
    }, [aberto]);

    // Esc: o navegador fecharia sozinho; avisamos quem controla o estado
    function handleCancel(e: React.SyntheticEvent<HTMLDialogElement>){
        e.preventDefault();
        onFechar();
    }

    // Clique no fundo escurecido: o alvo é o próprio <dialog>, e não algo dentro dele
    function handleClick(e: React.MouseEvent<HTMLDialogElement>){
        if(e.target === e.currentTarget) onFechar();
    }

    return (
        <dialog
        ref={dialogRef}
        className={styles.modal}
        onCancel={handleCancel}
        onClick={handleClick}
        aria-modal="true"
        aria-labelledby={tituloId}
        >
            <div className={styles.janela}>
                <div className={styles.topo}>
                    <h2 id={tituloId} className={styles.titulo}>{titulo}</h2>

                    <button type="button" className={styles.fechar} onClick={onFechar} aria-label="Fechar">
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.corpo}>
                    {children}
                </div>

                {acoes && <div className={styles.acoes}>{acoes}</div>}
            </div>
        </dialog>
    )
}
