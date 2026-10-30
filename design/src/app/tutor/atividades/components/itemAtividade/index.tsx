import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { Check, CircleAlert } from 'lucide-react'
import { ListItem } from '@/components/listItem'
import { Etiqueta } from '@/components/etiqueta'
import { formatarData, rotuloTipo } from '@/lib/formatacao'
import { AtividadeTutor, TipoAtividadeOpcao } from '@/lib/types'

interface Props {
    atividade: AtividadeTutor;
    tipos: TipoAtividadeOpcao[];
}

// Uma atividade da tela "Atividades" do tutor: título, sala, conteúdo, etapa, tipo, prazo e contagens.
// O item inteiro leva ao detalhe (/tutor/atividades/{id}), também pelo teclado
export function ItemAtividade({ atividade, tipos }: Props){
    const corrigida = atividade.total_com_nota >= atividade.total_destinatarios
    const paraCorrigir = atividade.total_entregues > atividade.total_com_nota

    const detalhe = [
        `Sala ${atividade.sala.nome}`,
        atividade.conteudo?.nome,
        `${atividade.etapa}ª etapa`,
        rotuloTipo(atividade.tipo, tipos)
    ].filter(Boolean).join(" · ")

    const icone = corrigida
        ? <Check color="var(--green-500)" role="img" aria-label="Corrigida" />
        : <CircleAlert color="var(--red-700)" role="img" aria-label="Falta nota" />

    return (
        <Link href={`/tutor/atividades/${atividade.id_atividade}`} className={lista.link}>
            <ListItem direita={icone}>
                <span className={lista.nome}>{atividade.titulo}</span>
                <span className={lista.detalhe}>{detalhe}</span>
                <span className={lista.detalhe}>Prazo: {formatarData(atividade.data_entrega)}</span>
                <span className={lista.detalhe}>
                    Entregues {atividade.total_entregues}/{atividade.total_destinatarios} · Corrigidas {atividade.total_com_nota}/{atividade.total_destinatarios}
                </span>
                {paraCorrigir && (
                    <span className={lista.etiquetas}><Etiqueta cor="destaque">Para corrigir</Etiqueta></span>
                )}
            </ListItem>
        </Link>
    )
}
