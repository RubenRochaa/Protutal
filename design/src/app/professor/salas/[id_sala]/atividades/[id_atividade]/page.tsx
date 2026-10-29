import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { RespostasAtividade, TipoAtividadeOpcao } from '@/lib/types'
import { formatarDataHora, rotuloTipo } from '@/lib/formatacao'
import { ErroCarregamento } from '../../../../components/erroCarregamento'
import { RespostasAlunos } from './components/respostasAlunos'

interface Props {
    params: Promise<{ id_sala: string; id_atividade: string }>;
}

// Detalhe da atividade (Figma p04) com o modal "Envio do aluno" (p01).
// P12 (GET /atividades/:id/respostas): todos os destinatários, com resposta e nota (ou null).
// O professor SÓ VISUALIZA: a nota aparece como texto, sem campo de edição.
export default async function AtividadeDetalhePage({ params }: Props){
    const { id_sala, id_atividade } = await params

    const [resultado, tipos] = await Promise.all([
        getAutenticado<RespostasAtividade>(`/atividades/${encodeURIComponent(id_atividade)}/respostas`),
        getAutenticado<TipoAtividadeOpcao[]>("/tipos-atividade")
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    const voltar = (
        <Link href={`/professor/salas/${id_sala}/atividades`} className={lista.voltar}>
            <ArrowLeft size={18} aria-hidden="true" /> Voltar para Atividades
        </Link>
    )

    if("erro" in resultado){
        return (
            <div className={lista.tela}>
                {voltar}
                <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
            </div>
        )
    }

    const atividade = resultado.dados
    const rotulos = "dados" in tipos ? tipos.dados : []

    return (
        <div className={lista.tela}>
            {voltar}

            <div>
                <h2 className={lista.nome}>{atividade.titulo}</h2>
                <span className={lista.detalhe}>
                    {rotuloTipo(atividade.tipo, rotulos)} · prazo {formatarDataHora(atividade.data_entrega)}
                </span>
            </div>

            <RespostasAlunos alunos={atividade.alunos} />
        </div>
    )
}
