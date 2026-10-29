import pagina from '../../page.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { anoAtual } from '@/lib/formatacao'
import { Sala } from '@/lib/types'
import { PageBanner } from '@/components/pageBanner'
import { ErroCarregamento } from '../../components/erroCarregamento'
import { SalasPorAno } from '../../components/salasPorAno'

// "Anos Passados" (Figma p21): salas de anos letivos anteriores (P20), agrupadas por ano.
// Cada sala leva para a aba Tutorias, onde as tutorias finalizadas ficam como histórico.
export default async function HistoricoTutoriaPage(){
    const resultado = await getAutenticado<Sala[]>("/salas")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    return (
        <main>
            <PageBanner titulo="Anos Passados" />

            <div className={pagina.conteudo}>
                <Link href="/professor/tutoria" className={lista.voltar}>
                    <ArrowLeft size={18} aria-hidden="true" /> Anos de Tutoria
                </Link>

                {"erro" in resultado ? (
                    <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
                ) : (
                    <SalasPorAno
                    salas={resultado.dados.filter((s) => s.ano_letivo < anoAtual())}
                    aba="tutorias"
                    mensagemVazia="Ainda não foi finalizado nenhum projeto de tutoria"
                    />
                )}
            </div>
        </main>
    )
}
