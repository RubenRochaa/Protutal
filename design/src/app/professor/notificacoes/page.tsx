import pagina from '../page.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData, formatarNota } from '@/lib/formatacao'
import { Contestacao, PedidoTutoria, Sala } from '@/lib/types'
import { PageBanner } from '@/components/pageBanner'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { ErroCarregamento } from '../components/erroCarregamento'
import { ListaPedidos } from '../components/listaPedidos'
import { MandarNotificacao } from './components/mandarNotificacao'

// "Notificações" (Figma p08), decisão D2. A API não tem rota de notificações:
// a tela junta o que está pendente nas salas do professor.
// - pedidos para ser tutor: P26 (GET /pedidos-tutoria), com Aceitar/Recusar (p05)
// - contestações de nota pendentes: P16 (GET /contestacoes?status=pendente)
// "Mandar notificação" publica um aviso numa sala (P3, modal p02). Itens "nota vinculada" ficam de fora.
export default async function NotificacoesPage(){
    const [pedidos, contestacoes, salas] = await Promise.all([
        getAutenticado<PedidoTutoria[]>("/pedidos-tutoria"),
        getAutenticado<Contestacao[]>("/contestacoes", { status: "pendente" }),
        getAutenticado<Sala[]>("/salas")
    ])

    const falha = [pedidos, contestacoes, salas].find((r) => "erro" in r)

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if(falha && "erro" in falha) sessaoExpiradaNaPagina(falha.erro)

    return (
        <main>
            <PageBanner titulo="Notificações" />

            <div className={pagina.conteudo}>
                {falha && "erro" in falha ? (
                    <ErroCarregamento mensagem={getErrorMessage(falha.erro)} status={getErrorStatus(falha.erro)} />
                ) : "dados" in pedidos && "dados" in contestacoes && "dados" in salas && (
                    <>
                        <div className={lista.topo}>
                            <p className={lista.ajuda}>Pedidos e contestações que esperam a sua decisão, em todas as suas salas.</p>
                            <MandarNotificacao salas={salas.dados} />
                        </div>

                        <ListaPedidos
                        pedidos={pedidos.dados}
                        mostrarSala
                        mensagemVazia="Nenhum pedido para ser tutor esperando decisão."
                        />

                        <Card titulo={`Contestações de nota pendentes (${contestacoes.dados.length})`} sublinhado>
                            {contestacoes.dados.length === 0 ? (
                                <EmptyState mensagem="Nenhuma contestação de nota esperando decisão." />
                            ) : (
                                <ul className={lista.lista}>
                                    {contestacoes.dados.map((c) => (
                                        <li key={c.id_contestacao}>
                                            <Link href={`/professor/salas/${c.sala.id_sala}/contestacoes?status=pendente`} className={lista.link}>
                                                <ListItem direita={<ChevronRight size={20} aria-hidden="true" />}>
                                                    <span className={lista.nome}>{c.aluno.nome} contestou uma nota</span>
                                                    <span className={lista.detalhe}>
                                                        {c.sala.nome} · {c.atividade.titulo} · nota {formatarNota(c.nota.valor)} · {formatarData(c.data_envio)}
                                                    </span>
                                                </ListItem>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </main>
    )
}
