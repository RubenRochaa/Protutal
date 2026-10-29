import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AtividadeSala, TipoAtividadeOpcao } from '@/lib/types'
import { formatarDataHora, rotuloTipo } from '@/lib/formatacao'
import { etapaDaUrl } from '@/lib/validacao'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { Etiqueta } from '@/components/etiqueta'
import { FiltroAbas } from '@/components/filtroAbas'
import { ErroCarregamento } from '../../../components/erroCarregamento'

interface Props {
    params: Promise<{ id_sala: string }>;
    searchParams: Promise<{ etapa?: string | string[] }>;
}

const OPCOES_ETAPA = [
    { valor: "", rotulo: "Todas as etapas" },
    { valor: "1", rotulo: "1ª etapa" },
    { valor: "2", rotulo: "2ª etapa" },
    { valor: "3", rotulo: "3ª etapa" },
]

// Aba "Atividades" (Figma p03, lista). SÓ CONSULTA: quem cria atividade é o tutor,
// por isso não há botão de criar. P11 (GET /salas/:id/atividades?etapa=) e T8 (rótulos dos tipos)
export default async function AtividadesSalaPage({ params, searchParams }: Props){
    const { id_sala } = await params
    const etapa = etapaDaUrl((await searchParams).etapa)

    const [resultado, tipos] = await Promise.all([
        getAutenticado<AtividadeSala[]>(`/salas/${encodeURIComponent(id_sala)}/atividades`, etapa ? { etapa } : undefined),
        getAutenticado<TipoAtividadeOpcao[]>("/tipos-atividade")
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    const atividades = resultado.dados
    const rotulos = "dados" in tipos ? tipos.dados : []

    return (
        <div className={lista.tela}>
            <p className={lista.ajuda}>
                Atividades criadas pelos tutores desta sala. Clique numa atividade para ver quem enviou e as notas.
            </p>

            <FiltroAbas parametro="etapa" opcoes={OPCOES_ETAPA} valor={etapa} rotulo="Filtrar atividades por etapa" />

            <Card titulo={`Atividades (${atividades.length})`} sublinhado>
                {atividades.length === 0 ? (
                    <EmptyState mensagem={etapa
                        ? "Nenhuma atividade nesta etapa."
                        : "Os tutores ainda não criaram atividades nesta sala."}
                    />
                ) : (
                    <ul className={lista.lista}>
                        {atividades.map((atividade) => (
                            <li key={atividade.id_atividade}>
                                <Link href={`/professor/salas/${id_sala}/atividades/${atividade.id_atividade}`} className={lista.link}>
                                    <ListItem direita={<span className={lista.detalhe}>Ver respostas</span>}>
                                        <span className={lista.nome}>{atividade.titulo}</span>
                                        <span className={lista.detalhe}>
                                            {rotuloTipo(atividade.tipo, rotulos)} · {atividade.conteudo?.nome ?? "Sem conteúdo"} · tutor {atividade.tutor.nome}
                                        </span>
                                        <span className={lista.detalhe}>Prazo: {formatarDataHora(atividade.data_entrega)}</span>
                                        <span className={lista.etiquetas}>
                                            <Etiqueta>{atividade.etapa}ª etapa</Etiqueta>
                                            <Etiqueta>Entregues {atividade.total_entregues}/{atividade.total_destinatarios}</Etiqueta>
                                            <Etiqueta>Com nota {atividade.total_com_nota}/{atividade.total_destinatarios}</Etiqueta>
                                        </span>
                                    </ListItem>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    )
}
