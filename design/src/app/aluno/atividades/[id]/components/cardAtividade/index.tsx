import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { formatarData } from '@/lib/formatacao'
import { AtividadeDetalheAluno } from '@/lib/types'

interface Props {
    atividade: AtividadeDetalheAluno;
    // Rótulo legível do tipo (ex.: "Prova dissertativa")
    tipo: string;
    // Prazo já passou (calculado no servidor)
    vencida: boolean;
}

// Coluna esquerda: título, conteúdo · etapa · tipo, tutor e sala, descrição e prazo.
// No Figma a descrição era uma lista de arquivos para baixar, mas a atividade não tem anexos na API
export function CardAtividade({ atividade, tipo, vencida }: Props){
    // Só a pendente fica em destaque: a entregue com atraso já tem o selo no card "Sua resposta"
    const prazoEncerrado = atividade.status === "pendente" && vencida

    const detalhe = [
        atividade.conteudo?.nome,
        `${atividade.etapa}ª etapa`,
        tipo
    ].filter(Boolean).join(" · ")

    return (
        <Card titulo={atividade.titulo}>
            <p className={styles.detalhe}>{detalhe}</p>
            <p className={styles.detalhe}>Tutor: {atividade.tutor.nome} · Sala {atividade.sala.nome}</p>

            <div className={styles.descricao}>
                <p>{atividade.descricao}</p>
            </div>

            <p className={prazoEncerrado ? `${styles.prazo} ${styles.prazoEncerrado}` : styles.prazo}>
                <span className={styles.rotuloPrazo}>Prazo de entrega:</span>
                <span>
                    {formatarData(atividade.data_entrega)}
                    {prazoEncerrado && " · Prazo encerrado"}
                </span>
            </p>
        </Card>
    )
}
