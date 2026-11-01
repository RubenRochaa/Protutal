import styles from './styles.module.scss'

interface Props {
    children: React.ReactNode;
    // "neutro" (cinza), "destaque" (vermelho) ou "sucesso" (verde)
    cor?: "neutro" | "destaque" | "sucesso";
}

// Selo pequeno de situação (ex.: "Ativa", "Pendente", "Em breve", "Revogado")
export function Etiqueta({ children, cor = "neutro" }: Props){
    return <span className={`${styles.etiqueta} ${styles[cor]}`}>{children}</span>
}
