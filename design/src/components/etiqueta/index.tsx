import styles from './styles.module.scss'
import { IconeStatus } from '@/lib/iconesStatus'

interface Props {
    children: React.ReactNode;
    // "neutro" (cinza), "destaque" (vermelho) ou "sucesso" (verde)
    cor?: "neutro" | "destaque" | "sucesso";
}

// Selo pequeno de situação (ex.: "Ativa", "Pendente", "Em breve", "Revogado").
// Com o modo daltônico ligado, o status também ganha um ícone (lib/iconesStatus.tsx)
export function Etiqueta({ children, cor = "neutro" }: Props){
    return (
        <span className={`${styles.etiqueta} ${styles[cor]}`}>
            <IconeStatus texto={children} />
            {children}
        </span>
    )
}
