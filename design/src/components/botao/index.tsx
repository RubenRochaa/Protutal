import styles from './styles.module.scss'
import Link from 'next/link'
import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    // "primario" = vermelho cheio; "secundario" = contorno vermelho; "perigo" = ação destrutiva
    variante?: "primario" | "secundario" | "perigo";
    // Com href, vira um link com a mesma aparência
    href?: string;
    pequeno?: boolean;
}

// Botão de ação das telas (abrir modal, aceitar, revogar...).
// Para enviar formulário com o carregamento automático, continue usando o Button.
export function Botao({ variante = "primario", href, pequeno = false, className, children, ...rest }: Props){
    const classes = [styles.botao, styles[variante], pequeno ? styles.pequeno : "", className ?? ""].join(" ")

    if(href) return <Link href={href} className={classes}>{children}</Link>;

    return (
        <button type="button" className={classes} {...rest}>
            {children}
        </button>
    )
}
