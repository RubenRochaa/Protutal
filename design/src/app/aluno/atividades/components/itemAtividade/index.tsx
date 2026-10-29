import styles from './styles.module.scss'
import { Check, CircleAlert } from 'lucide-react'
import { ListItem } from '@/components/listItem'
import { AtividadeAluno } from '@/lib/types'

// Datas sempre no fuso de São Paulo: a API devolve em UTC
// (ex.: 2026-11-11T02:59Z = 10/11/2026 às 23h59)
const formatoData = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" })

interface Props {
    atividade: AtividadeAluno;
}

// Uma atividade da tela "Minhas atividades": título, conteúdo e etapa, prazo, selos e ícone de status.
// Ainda não é clicável: na tela de detalhe vira um Link para /aluno/atividades/{id_atividade}
export function ItemAtividade({ atividade }: Props){
    const realizada = atividade.status !== "pendente"
    const prazo = formatoData.format(new Date(atividade.data_entrega))
    // Roda no servidor, a cada busca: compara o prazo com a hora atual
    const vencida = !realizada && new Date(atividade.data_entrega) < new Date()
    const comAtraso = atividade.status === "entregue_com_atraso"
    // Pendente de tutoria finalizada: não pode mais ser respondida.
    // (Nas realizadas pode_responder também é false, mas porque o aluno já respondeu)
    const encerrada = !realizada && !atividade.pode_responder

    const etapa = `${atividade.etapa}ª etapa`
    const detalhe = atividade.conteudo ? `${atividade.conteudo.nome} · ${etapa}` : etapa

    let icone: React.ReactNode = null
    if(realizada){
        icone = <Check className={styles.iconeEntregue} role="img" aria-label="Entregue" />
    } else if(vencida){
        icone = <CircleAlert className={styles.iconeAtrasada} role="img" aria-label="Atrasada" />
    }

    return (
        <ListItem direita={icone}>
            <p className={styles.titulo}>{atividade.titulo}</p>
            <p className={styles.detalhe}>{detalhe}</p>

            {!realizada && (
                <p className={vencida ? styles.prazoVencido : styles.detalhe}>
                    {vencida ? `Prazo encerrado em ${prazo}` : `Entregar até ${prazo}`}
                </p>
            )}

            {comAtraso && <span className={styles.selo}>Entregue com atraso</span>}
            {encerrada && <span className={styles.selo}>Encerrada</span>}
        </ListItem>
    )
}
