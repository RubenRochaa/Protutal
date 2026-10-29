import lista from '@/app/professor/lista.module.scss'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AlunoSala, NotaSala, TutorSala } from '@/lib/types'
import { etapaDaUrl } from '@/lib/validacao'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { FiltroAbas } from '@/components/filtroAbas'
import { FiltroSelect } from '@/components/filtroSelect'
import { ErroCarregamento } from '../../../components/erroCarregamento'
import { BotaoExportar } from '../../../components/botaoExportar'
import { TabelaNotas } from './components/tabelaNotas'

interface Props {
    params: Promise<{ id_sala: string }>;
    searchParams: Promise<{ etapa?: string | string[]; id_aluno?: string | string[]; id_tutor_sala?: string | string[] }>;
}

const OPCOES_ETAPA = [
    { valor: "", rotulo: "Todas as etapas" },
    { valor: "1", rotulo: "1ª etapa" },
    { valor: "2", rotulo: "2ª etapa" },
    { valor: "3", rotulo: "3ª etapa" },
]

// Id vindo da URL: só inteiro positivo; o resto vira "" (sem filtro)
function idDaUrl(valor: string | string[] | undefined){
    return typeof valor === "string" && /^[1-9]\d*$/.test(valor) ? valor : ""
}

// Aba "Notas" (sem Figma para a tabela). SÓ CONSULTA: quem lança nota é o tutor.
// P14 (GET /salas/:id/notas) com os filtros da URL; P23 e P24 preenchem os selects de aluno e tutor.
// "Exportar" usa a P15 com os mesmos filtros, pelo Route Handler.
export default async function NotasSalaPage({ params, searchParams }: Props){
    const { id_sala } = await params
    const busca = await searchParams
    const filtros = {
        etapa: etapaDaUrl(busca.etapa),
        id_aluno: idDaUrl(busca.id_aluno),
        id_tutor_sala: idDaUrl(busca.id_tutor_sala),
    }
    const paramsApi = Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor !== ""))
    const id = encodeURIComponent(id_sala)

    const [notas, alunos, tutores] = await Promise.all([
        getAutenticado<NotaSala[]>(`/salas/${id}/notas`, paramsApi),
        getAutenticado<AlunoSala[]>(`/salas/${id}/alunos`),
        getAutenticado<TutorSala[]>(`/salas/${id}/tutores`)
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in notas) sessaoExpiradaNaPagina(notas.erro)

    if("erro" in notas){
        return <ErroCarregamento mensagem={getErrorMessage(notas.erro)} status={getErrorStatus(notas.erro)} />
    }

    // Os selects são só ajuda: se a P23 ou a P24 falhar, o filtro correspondente some
    const opcoesAluno = "dados" in alunos
        ? [{ valor: "", rotulo: "Todos os alunos" }, ...alunos.dados.map((a) => ({ valor: String(a.id_aluno), rotulo: a.nome }))]
        : null
    // A P24 só traz tutores ativos: notas de tutores revogados aparecem com "Todos os tutores"
    const opcoesTutor = "dados" in tutores
        ? [{ valor: "", rotulo: "Todos os tutores" }, ...tutores.dados.map((t) => ({ valor: String(t.id_tutor_sala), rotulo: t.aluno.nome }))]
        : null

    const comFiltro = Object.keys(paramsApi).length > 0

    return (
        <div className={lista.tela}>
            <p className={lista.ajuda}>
                Notas lançadas pelos tutores nesta sala. Aluno sem nota não aparece na lista.
            </p>

            <FiltroAbas parametro="etapa" opcoes={OPCOES_ETAPA} valor={filtros.etapa} rotulo="Filtrar notas por etapa" />

            <div className={lista.topo}>
                <div className={lista.filtros}>
                    {opcoesAluno && <FiltroSelect parametro="id_aluno" label="Aluno" opcoes={opcoesAluno} valor={filtros.id_aluno} />}
                    {opcoesTutor && <FiltroSelect parametro="id_tutor_sala" label="Tutor" opcoes={opcoesTutor} valor={filtros.id_tutor_sala} />}
                </div>

                <BotaoExportar idSala={Number(id_sala)} filtros={filtros} />
            </div>

            <Card titulo={`Notas (${notas.dados.length})`} sublinhado>
                {notas.dados.length === 0 ? (
                    <EmptyState mensagem={comFiltro
                        ? "Nenhuma nota encontrada com esses filtros."
                        : "Ainda não há notas lançadas nesta sala. As notas aparecem aqui quando os tutores corrigem as atividades."}
                    />
                ) : (
                    <TabelaNotas notas={notas.dados} />
                )}
            </Card>
        </div>
    )
}
