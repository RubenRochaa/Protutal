import pagina from '../../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { ListItem } from '@/components/listItem'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AtividadeTutor } from '@/lib/types'
import { ToastErro } from '@/app/aluno/components/toastErro'

const TITULO = "Atividades pendentes"
const LIMITE = 5

// Card "Atividades pendentes": atividades com entrega ainda sem nota (para corrigir), rota T2
export async function CardPendentes(){
    const resultado = await getAutenticado<AtividadeTutor[]>("/tutores/me/atividades")

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO}><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    const paraCorrigir = resultado.dados.filter((a) => a.total_entregues > a.total_com_nota)

    return (
        <Card titulo={TITULO}>
            {paraCorrigir.length === 0 ? (
                <EmptyState mensagem="Nenhuma entrega esperando correção." imagem={null} />
            ) : (
                <ul className={lista.lista}>
                    {paraCorrigir.slice(0, LIMITE).map((atividade) => (
                        <li key={atividade.id_atividade}>
                            <Link href={`/tutor/atividades/${atividade.id_atividade}`} className={lista.link}>
                                <ListItem>
                                    <span className={lista.nome}>{atividade.titulo}</span>
                                    <span className={lista.detalhe}>
                                        {atividade.sala.nome} · {atividade.total_entregues - atividade.total_com_nota} para corrigir
                                    </span>
                                </ListItem>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <Link href="/tutor/atividades" className={pagina.verTodas}>Ver todas</Link>
        </Card>
    )
}
