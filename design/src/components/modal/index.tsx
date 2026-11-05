"use client"

import styles from './styles.module.scss'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
    aberto: boolean;
    onFechar: () => void;
    titulo: string;
    children: React.ReactNode;
}

// Janela branca sobre o fundo escurecido (print "Permissões como tutor").
// Usa o <dialog> nativo: ele já escurece o fundo, prende o foco dentro da janela e trata o Esc.
// Quem usa controla o estado: <Modal aberto={aberto} onFechar={() => setAberto(false)} ...>
export function Modal({ aberto, onFechar, titulo, children }: Props){
    const dialogRef = useRef<HTMLDialogElement>(null);

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

    return (
        <dialog
        ref={dialogRef}
        className={styles.modal}
        onCancel={handleCancel}
        aria-labelledby="modal-titulo"
        >
            <div className={styles.topo}>
                <h2 id="modal-titulo" className={styles.titulo}>{titulo}</h2>

                <button type="button" className={styles.fechar} onClick={onFechar} aria-label="Fechar">
                    <X size={24} />
                </button>
            </div>

            <div className={styles.corpo}>
                {children}
            </div>
        </dialog>
    )
}
