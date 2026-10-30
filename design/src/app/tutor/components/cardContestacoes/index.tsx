import pagina from '../../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { ListItem } from '@/components/listItem'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarNota } from '@/lib/formatacao'
import { Contestacao } from '@/lib/types'
import { ToastErro } from '@/app/aluno/components/toastErro'

const TITULO = "Avaliações com justificativa"
const LIMITE = 5

// Card "Avaliações com justificativa": contestações de nota pendentes (rota P16)
export async function CardContestacoes(){
    const resultado = await getAutenticado<Contestacao[]>("/contestacoes", { status: "pendente" })

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO}><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    return (
        <Card titulo={TITULO}>
            {resultado.dados.length === 0 ? (
                <EmptyState mensagem="Nenhuma contestação pendente." />
            ) : (
                <ul className={lista.lista}>
                    {resultado.dados.slice(0, LIMITE).map((c) => (
                        <li key={c.id_contestacao}>
                            <Link href="/tutor/contestacoes" className={lista.link}>
                                <ListItem>
                                    <span className={lista.nome}>{c.atividade.titulo}</span>
                                    <span className={lista.detalhe}>{c.aluno.nome} · nota {formatarNota(c.nota.valor)}</span>
                                </ListItem>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <Link href="/tutor/contestacoes" className={pagina.verTodas}>Ver todas</Link>
        </Card>
    )
}
