import styles from './styles.module.scss'
import { ExternalLink } from 'lucide-react'
import { Card } from '@/components/card'
import { formatarDataHora } from '@/lib/formatacao'
import { AtividadeDetalheAluno, StatusAtividadeAluno } from '@/lib/types'

interface Props {
    resposta: NonNullable<AtividadeDetalheAluno["resposta"]>;
    status: StatusAtividadeAluno;
}

// Card "Sua resposta": o aluno já respondeu (a A14 aceita uma resposta só, sem edição)
export function CardResposta({ resposta, status }: Props){
    const comAtraso = status === "entregue_com_atraso"

    return (
        <Card titulo="Sua resposta">
            <div className={styles.linha}>
                <span className={styles.envio}>Enviada em {formatarDataHora(resposta.data_envio)}</span>

                <span className={comAtraso ? `${styles.selo} ${styles.seloAtraso}` : styles.selo}>
                    {comAtraso ? "Entregue com atraso" : "Entregue"}
                </span>
            </div>

            <a
            href={resposta.conteudo_file}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.arquivo}
            >
                <ExternalLink size={18} aria-hidden="true" />
                Abrir arquivo enviado
                <span className={styles.oculto}> (abre em nova aba)</span>
            </a>

            {resposta.texto && (
                <div className={styles.comentario}>
                    <p className={styles.rotulo}>Seu comentário</p>
                    <p>{resposta.texto}</p>
                </div>
            )}
        </Card>
    )
}
