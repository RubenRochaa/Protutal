import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AlunoSala, TutorSala, TutoriaSala } from '@/lib/types'
import { anoAtual } from '@/lib/formatacao'
import { ErroCarregamento } from '../../../components/erroCarregamento'
import { buscarSala } from '../buscarSala'
import { ListaTutorias } from './components/listaTutorias'

interface Props {
    params: Promise<{ id_sala: string }>;
    searchParams: Promise<{ status?: string | string[] }>;
}

// Aba "Tutorias" (sem Figma; padrão "Lista com filtro").
// P4 (GET /salas/:id/tutorias?status=) com o filtro da URL; P24 (tutores) e P23 (alunos)
// preenchem os selects do modal "Nova tutoria".
export default async function TutoriasSalaPage({ params, searchParams }: Props){
    const { id_sala } = await params
    const { status } = await searchParams

    // Só os valores que a API aceita; qualquer outro vira "todas"
    const filtro = status === "ativa" || status === "finalizada" ? status : ""
    const id = encodeURIComponent(id_sala)

    const [tutorias, tutores, alunos, sala] = await Promise.all([
        getAutenticado<TutoriaSala[]>(`/salas/${id}/tutorias`, filtro ? { status: filtro } : undefined),
        getAutenticado<TutorSala[]>(`/salas/${id}/tutores`),
        getAutenticado<AlunoSala[]>(`/salas/${id}/alunos`),
        buscarSala(id_sala)
    ])

    // A primeira falha decide a tela (as quatro rotas têm o mesmo dono: a sala)
    const falha = [tutorias, tutores, alunos].find((r) => "erro" in r)

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if(falha && "erro" in falha) sessaoExpiradaNaPagina(falha.erro)

    if(falha && "erro" in falha){
        return <ErroCarregamento mensagem={getErrorMessage(falha.erro)} status={getErrorStatus(falha.erro)} />
    }

    if(!("dados" in tutorias) || !("dados" in tutores) || !("dados" in alunos) || "erro" in sala) return null;

    return (
        <ListaTutorias
        tutorias={tutorias.dados}
        tutores={tutores.dados}
        alunos={alunos.dados}
        filtro={filtro}
        // Reabrir só funciona no ano letivo atual (regra da P7)
        anoAtualDaSala={sala.sala.ano_letivo === anoAtual()}
        anoLetivo={sala.sala.ano_letivo}
        />
    )
}
