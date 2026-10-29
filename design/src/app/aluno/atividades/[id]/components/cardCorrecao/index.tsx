import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { formatarNota } from '@/lib/formatacao'
import { AtividadeDetalheAluno } from '@/lib/types'
import { BotaoContestar } from '../../../../components/botaoContestar'

interface Props {
    nota: NonNullable<AtividadeDetalheAluno["nota"]>;
    idAtividade: number;
    tituloAtividade: string;
}

// Card "Correção do tutor": nota (ex.: 8,5), comentário e o botão de contestar.
// A A2 não diz se a nota já foi contestada: o botão aparece sempre, e a A8 avisa com 409
export function CardCorrecao({ nota, idAtividade, tituloAtividade }: Props){
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

            <div className={styles.contestar}>
                <BotaoContestar idNota={nota.id_nota} idAtividade={idAtividade} tituloAtividade={tituloAtividade} />
            </div>
        </Card>
    )
}
