"use client"

import styles from './styles.module.scss'
import { useFormStatus } from 'react-dom'
import { Loader } from '../loader'

interface Props {
    name: string;
    nameCarregando?: string;
    // bloqueia o botão além do envio (ex.: espera de 60 s antes de pedir outro link)
    disabled?: boolean;
}

// Botão de envio de formulário: fica desabilitado e com texto de carregamento enquanto envia
export function Button({ name, nameCarregando = "Carregando...", disabled = false }: Props){
    const { pending } = useFormStatus();

    return (
        <button type='submit' disabled={pending || disabled} className={styles.button}>
            {pending && <Loader size="pequeno" variant="branco" decorativo />}
            {pending ? nameCarregando : name}
        </button>
    )
}
