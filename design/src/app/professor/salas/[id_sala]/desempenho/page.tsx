import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { DesempenhoTutor, NotaSala } from '@/lib/types'
import { calcularMedia } from '@/lib/media'
import { ErroCarregamento } from '../../../components/erroCarregamento'
import { PainelDesempenho, DesempenhoAlunoSala } from './components/painelDesempenho'

interface Props {
    params: Promise<{ id_sala: string }>;
}

const ETAPAS = [1, 2, 3]

// Agrupa as notas da P14 por aluno e calcula as médias com a mesma regra do back-end
// (decisão D5). Aluno sem nota não aparece na P14, então também não aparece aqui.
function mediasPorAluno(notas: NotaSala[]): DesempenhoAlunoSala[] {
    const porAluno = new Map<number, { nome: string; notas: NotaSala[] }>()

    for(const nota of notas){
        const atual = porAluno.get(nota.aluno.id_aluno) ?? { nome: nota.aluno.nome, notas: [] }
        atual.notas.push(nota)
        porAluno.set(nota.aluno.id_aluno, atual)
    }

    return [...porAluno.entries()].map(([id_aluno, { nome, notas: lista }]) => ({
        id_aluno,
        nome,
        media_geral: calcularMedia(lista.map((n) => n.valor)),
        quantidade: lista.length,
        por_etapa: ETAPAS.map((etapa) => ({
            etapa,
            media: calcularMedia(lista.filter((n) => n.atividade.etapa === etapa).map((n) => n.valor)),
        })),
    }))
}

// Aba "Desempenho" (Figma p14: Tutorados e Tutores; p09 e p20: lista com gráfico).
// Tutores: P13 (GET /salas/:id/desempenho-tutores). Tutorados: médias montadas a partir da P14.
export default async function DesempenhoSalaPage({ params }: Props){
    const { id_sala } = await params
    const id = encodeURIComponent(id_sala)

    const [tutores, notas] = await Promise.all([
        getAutenticado<DesempenhoTutor[]>(`/salas/${id}/desempenho-tutores`),
        getAutenticado<NotaSala[]>(`/salas/${id}/notas`)
    ])

    const falha = [tutores, notas].find((r) => "erro" in r)

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if(falha && "erro" in falha) sessaoExpiradaNaPagina(falha.erro)

    if(falha && "erro" in falha){
        return <ErroCarregamento mensagem={getErrorMessage(falha.erro)} status={getErrorStatus(falha.erro)} />
    }

    if(!("dados" in tutores) || !("dados" in notas)) return null;

    return <PainelDesempenho tutores={tutores.dados} alunos={mediasPorAluno(notas.dados)} />
}
