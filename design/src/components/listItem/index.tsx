import styles from './styles.module.scss'

interface Props {
    children: React.ReactNode;
    direita?: React.ReactNode;
}

// Pílula branca com bolinha à esquerda e o texto (children).
// "direita" é o espaço opcional para ícone, valor ou ação (ex.: botão de download)
export function ListItem({ children, direita }: Props){
    return (
        <div className={styles.item}>
            <span className={styles.bolinha} aria-hidden="true" />
            <div className={styles.texto}>{children}</div>
            {direita && <div className={styles.direita}>{direita}</div>}
        </div>
    )
}
