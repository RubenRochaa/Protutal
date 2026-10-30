import pagina from '../../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { EmptyState } from '@/components/emptyState'
import { PageBanner } from '@/components/pageBanner'
import { FiltroSelect } from '@/components/filtroSelect'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { ConteudoSala, TutoriaTutor } from '@/lib/types'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { buscarTipos, buscarTutorias, idDaUrl } from '../../buscas'
import { FormAtividade } from './components/formAtividade'

interface Props {
    searchParams: Promise<{ tutoria?: string | string[] }>;
}

// Tela "Criar atividades" (print 5, rota T9). Passo 1: escolher o tutorado (?tutoria= na URL).
// Passo 2: com a tutoria escolhida, o servidor busca os conteúdos da sala (P2) e os tipos (T8).
// O upload de arquivo do print não existe na API (a T9 é JSON): não aparece
export default async function NovaAtividadePage({ searchParams }: Props){
    const { tutoria: tutoriaUrl } = await searchParams

    return (
        <main>
            <PageBanner titulo="Criar atividades" />

            <div className={pagina.conteudo}>
                <Link href="/tutor/atividades" className={lista.voltar}>
                    <ArrowLeft size={20} aria-hidden="true" /> Voltar para Atividades
                </Link>

                <Suspense fallback={<Loading />}>
                    <EscolhaTutorado idUrl={idDaUrl(tutoriaUrl)} />
                </Suspense>
            </div>
        </main>
    )
}

// Select "Tutorado" com as tutorias ativas da T1 ("Aluno · Sala") e, abaixo, o formulário
async function EscolhaTutorado({ idUrl }: { idUrl: string }){
    const resultado = await buscarTutorias("ativa")

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    if(resultado.dados.length === 0){
        return <Card><EmptyState mensagem="Você não tem tutorados ativos para receber atividades." /></Card>
    }

    // ?tutoria= de uma tutoria que não é ativa (ou não é dele) = nenhuma escolhida
    const tutoria = resultado.dados.find((t) => String(t.id_tutoria) === idUrl)

    const opcoes = [
        { valor: "", rotulo: "Escolha o tutorado" },
        ...resultado.dados.map((t) => ({ valor: String(t.id_tutoria), rotulo: `${t.aluno.nome} · Sala ${t.sala.nome}` }))
    ]

    return (
        <>
            <div className={lista.filtros}>
                <FiltroSelect parametro="tutoria" label="Tutorado" opcoes={opcoes} valor={tutoria ? idUrl : ""} />
            </div>

            {tutoria ? (
                <Suspense key={tutoria.id_tutoria} fallback={<Loading />}>
                    <BlocoFormulario tutoria={tutoria} />
                </Suspense>
            ) : (
                <p className={lista.ajuda}>Escolha o tutorado que vai receber a atividade.</p>
            )}
        </>
    )
}

// Conteúdos da sala da tutoria (P2) e tipos (T8): sem eles não dá para montar o formulário
async function BlocoFormulario({ tutoria }: { tutoria: TutoriaTutor }){
    const [conteudos, tipos] = await Promise.all([
        getAutenticado<ConteudoSala[]>(`/salas/${tutoria.sala.id_sala}/conteudos`),
        buscarTipos()
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in conteudos) sessaoExpiradaNaPagina(conteudos.erro)
    if("erro" in tipos) sessaoExpiradaNaPagina(tipos.erro)

    if("erro" in conteudos){
        return <ErroCarregamento mensagem={getErrorMessage(conteudos.erro)} status={getErrorStatus(conteudos.erro)} />
    }

    if(conteudos.dados.length === 0){
        return <Card><EmptyState mensagem="O professor ainda não cadastrou conteúdos nesta sala." /></Card>
    }

    if("erro" in tipos){
        return <ErroCarregamento mensagem={getErrorMessage(tipos.erro)} status={getErrorStatus(tipos.erro)} />
    }

    return (
        <FormAtividade
        idTutoria={tutoria.id_tutoria}
        conteudos={conteudos.dados.map((c) => ({ valor: String(c.id_conteudo), rotulo: c.nome }))}
        tipos={tipos.dados.map((t) => ({ valor: t.valor, rotulo: t.rotulo }))}
        />
    )
}
