import styles from './styles.module.scss'
import { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    name: string;
}

// Campo de texto em várias linhas, com o rótulo em cima (mesmo visual do Input).
// Com maxLength e valor controlado, mostra o contador de caracteres
export function Textarea({ label, name, maxLength, value, ...rest }: Props){
    const tamanho = typeof value === "string" ? value.length : null

    return (
        <div className={styles.campo}>
            <label htmlFor={name} className={styles.label}>{label}</label>
            <textarea id={name} name={name} className={styles.textarea} maxLength={maxLength} value={value} rows={4} {...rest} />
            {maxLength !== undefined && tamanho !== null && (
                <span className={styles.contador}>{tamanho}/{maxLength}</span>
            )}
        </div>
    )
}
