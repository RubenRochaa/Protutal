import styles from './styles.module.scss'
import { Mascote } from '../mascote'
import { ImagemMascote, MASCOTES } from '@/lib/mascotes'

interface Props {
    mensagem: string;
    // Botão ou link opcional embaixo do texto (ex.: "Adicionar alunos")
    acao?: React.ReactNode;
    // Mascote acima do texto. Padrão: mascote com o mapa (areasVazias).
    // Telas com imagem própria passam MASCOTES.<nome>; null = sem imagem (ex.: cartões do início)
    imagem?: ImagemMascote | null;
}

// Lista vazia: quadro branco com o mascote e o texto centralizado (print "Anos Passados").
// Na tela, use dentro de um Card: <Card><EmptyState mensagem="..." /></Card>
export function EmptyState({ mensagem, acao, imagem = MASCOTES.areasVazias }: Props){
    return (
        <div className={styles.quadro}>
            {imagem && <Mascote imagem={imagem} className={styles.imagem} />}
            <p className={styles.mensagem}>{mensagem}</p>
            {acao && <div className={styles.acao}>{acao}</div>}
        </div>
    )
}
