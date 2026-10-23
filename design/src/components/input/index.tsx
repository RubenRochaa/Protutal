import styles from './styles.module.scss'
import { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
}

// Campo de formulário com o rótulo em cima, como no Figma.
// Aceita qualquer atributo de <input> (type, placeholder, required, autoComplete...)
export function Input({ label, name, ...rest }: Props){
    return (
        <div className={styles.campo}>
            <label htmlFor={name} className={styles.label}>{label}</label>
            <input id={name} name={name} className={styles.input} {...rest} />
        </div>
    )
}
