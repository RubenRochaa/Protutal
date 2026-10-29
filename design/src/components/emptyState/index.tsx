import styles from './styles.module.scss'

interface Props {
    mensagem: string;
    // Botão ou link opcional embaixo do texto (ex.: "Adicionar alunos")
    acao?: React.ReactNode;
}

// Lista vazia: quadro branco com o texto centralizado (print "Anos Passados").
// Na tela, use dentro de um Card: <Card><EmptyState mensagem="..." /></Card>
export function EmptyState({ mensagem, acao }: Props){
    return (
        <div className={styles.quadro}>
            <p className={styles.mensagem}>{mensagem}</p>
            {acao && <div className={styles.acao}>{acao}</div>}
        </div>
    )
}
