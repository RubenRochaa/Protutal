"use client"

import styles from './styles.module.scss'
import { useFormStatus } from 'react-dom'

interface Props {
    name: string;
    nameCarregando?: string;
}

// Botão de envio de formulário: fica desabilitado e com texto de carregamento enquanto envia
export function Button({ name, nameCarregando = "Carregando..." }: Props){
    const { pending } = useFormStatus();

    return (
        <button type='submit' disabled={pending} className={styles.button}>
            {pending ? nameCarregando : name}
        </button>
    )
}
