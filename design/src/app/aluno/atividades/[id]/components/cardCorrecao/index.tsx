import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { formatarNota } from '@/lib/formatacao'
import { AtividadeDetalheAluno } from '@/lib/types'

interface Props {
    nota: NonNullable<AtividadeDetalheAluno["nota"]>;
}

// Card "Correção do tutor": nota (ex.: 8,5) e comentário.
// O botão de contestar a nota é do lote B5
export function CardCorrecao({ nota }: Props){
    return (
        <Card titulo="Correção do tutor">
            <p className={styles.nota}>
                <span className={styles.valor}>{formatarNota(nota.valor)}</span>
                <span className={styles.total}> / 10</span>
            </p>

            {nota.comentario && (
                <div className={styles.comentario}>
                    <p className={styles.rotulo}>Comentário do tutor</p>
                    <p>{nota.comentario}</p>
                </div>
            )}
        </Card>
    )
}
