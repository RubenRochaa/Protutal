import styles from './styles.module.scss'

interface Props {
    mensagem: string;
}

// Lista vazia: quadro branco com o texto centralizado (print "Anos Passados").
// Na tela, use dentro de um Card: <Card><EmptyState mensagem="..." /></Card>
export function EmptyState({ mensagem }: Props){
    return (
        <div className={styles.quadro}>
            <p className={styles.mensagem}>{mensagem}</p>
        </div>
    )
}
