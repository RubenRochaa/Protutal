"use server"

import { revalidatePath } from 'next/cache'
import { api } from '@/services/api'
import { getCookieServer } from '@/lib/cookieServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaAction } from '@/lib/sessaoExpirada'
import { executarAcao } from '@/lib/acaoServidor'
import { getAutenticado } from '@/lib/apiServer'
import { textoVazio, validarNota, validarSala } from '@/lib/validacao'
import { ActionState, AvaliacoesTutor } from '@/lib/types'

// Roda no servidor: cria a sala do professor logado (rota P19 - POST /salas).
// O professor vem do token; o corpo leva só nome, serie e ano_letivo.
export async function handleCriarSala(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const nome = String(formData.get("nome") ?? "")
    const serie = String(formData.get("serie") ?? "")
    const anoLetivo = String(formData.get("ano_letivo") ?? "")

    const valores = { nome, serie, ano_letivo: anoLetivo }

    // Valida de novo aqui: o navegador pode ter sido burlado
    const erroValidacao = validarSala(nome, serie, anoLetivo)
    if(erroValidacao) return { error: erroValidacao, valores };

    const token = await getCookieServer()
    let erro: unknown

    try {
        await api.post("/salas", {
            nome: nome.trim(),
            serie: Number(serie),
            ano_letivo: Number(anoLetivo)
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch(err) {
        erro = err
    }

    if(erro){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        await sessaoExpiradaNaAction(erro)

        return { error: getErrorMessage(erro), valores }
    }

    // Faz a página buscar a lista de novo, já com a sala nova
    revalidatePath("/professor")

    return { sucesso: "Sala criada com sucesso!" }
}

// ---------- Ações das abas da sala e das telas gerais (lotes A2 a A5) ----------
// Cada ação valida de novo no servidor (o navegador pode ter sido burlado) com as mesmas
// regras e mensagens do back-end e chama a API pelo executarAcao (src/lib/acaoServidor.ts).

// P25 - POST /salas/:id/conteudos
export async function handleCadastrarConteudo(idSala: number, nome: string): Promise<ActionState> {
    if(textoVazio(nome)) return { error: "O campo nome é obrigatório" };
    if(nome.trim().length > 100) return { error: "O nome deve ter no máximo 100 caracteres" };

    return executarAcao(
        { metodo: "post", url: `/salas/${idSala}/conteudos`, corpo: { nome: nome.trim() } },
        "Conteúdo cadastrado com sucesso!"
    )
}

// P3 - POST /salas/:id/avisos (a API exige pelo menos uma tutoria ativa na sala)
export async function handlePublicarAviso(idSala: number, titulo: string, conteudo: string): Promise<ActionState> {
    if(!Number.isInteger(idSala) || idSala <= 0) return { error: "Escolha a sala do aviso" };
    if(textoVazio(titulo)) return { error: "O campo titulo é obrigatório" };
    if(titulo.trim().length > 150) return { error: "O título deve ter no máximo 150 caracteres" };
    if(textoVazio(conteudo)) return { error: "O campo conteudo é obrigatório" };

    return executarAcao(
        { metodo: "post", url: `/salas/${idSala}/avisos`, corpo: { titulo: titulo.trim(), conteudo: conteudo.trim() } },
        "Aviso publicado para a sala!"
    )
}

// P27 - PATCH /pedidos-tutoria/:id/aceitar (o id_sala precisa ser a sala do pedido)
export async function handleAceitarPedido(idPedido: number, idSala: number): Promise<ActionState> {
    return executarAcao(
        { metodo: "patch", url: `/pedidos-tutoria/${idPedido}/aceitar`, corpo: { id_sala: idSala } },
        "Pedido aceito: o aluno agora é tutor da sala."
    )
}

// P28 - PATCH /pedidos-tutoria/:id/recusar
export async function handleRecusarPedido(idPedido: number): Promise<ActionState> {
    return executarAcao(
        { metodo: "patch", url: `/pedidos-tutoria/${idPedido}/recusar` },
        "Pedido recusado."
    )
}

// P29 - PATCH /salas/:id/permissao-atividades (vale para todos os tutores ativos da sala)
export async function handlePermissaoAtividades(idSala: number, podeCriar: boolean): Promise<ActionState> {
    return executarAcao(
        { metodo: "patch", url: `/salas/${idSala}/permissao-atividades`, corpo: { pode_criar_ativ: podeCriar } },
        podeCriar
            ? "Os tutores da sala agora podem criar atividades."
            : "Os tutores da sala não podem mais criar atividades."
    )
}

// P8 - PATCH /tutores-sala/:id/revogar (também finaliza as tutorias ativas do tutor)
export async function handleRevogarTutor(idTutorSala: number): Promise<ActionState> {
    return executarAcao(
        { metodo: "patch", url: `/tutores-sala/${idTutorSala}/revogar` },
        "Tutor removido da sala."
    )
}

// P9 - POST /tutores-sala/:id/avaliacoes. A nota chega como texto (aceita vírgula)
export async function handleAvaliarTutor(idTutorSala: number, notaTexto: string, comentario: string): Promise<ActionState> {
    const nota = validarNota(notaTexto, "nota")
    if("erro" in nota) return { error: nota.erro };
    if(textoVazio(comentario)) return { error: "O campo comentario é obrigatório e não pode ser vazio" };

    return executarAcao(
        { metodo: "post", url: `/tutores-sala/${idTutorSala}/avaliacoes`, corpo: { nota: nota.valor, comentario: comentario.trim() } },
        "Avaliação registrada!"
    )
}

// P10 - GET /tutores-sala/:id/avaliacoes. Leitura feita quando o modal "Avaliar" abre:
// o token fica no servidor, por isso a busca também é uma Server Action
export async function buscarAvaliacoesTutor(idTutorSala: number): Promise<{ dados: AvaliacoesTutor } | { error: string }> {
    const resultado = await getAutenticado<AvaliacoesTutor>(`/tutores-sala/${idTutorSala}/avaliacoes`)

    if("erro" in resultado){
        // Fora do try/catch (o getAutenticado já tratou): o redirect do Next funciona lançando um erro
        await sessaoExpiradaNaAction(resultado.erro)

        return { error: getErrorMessage(resultado.erro) }
    }

    return resultado
}

// P30 - POST /tutorias
export async function handleCriarTutoria(idTutorSala: number, idAluno: number, meta: string): Promise<ActionState> {
    if(!Number.isInteger(idTutorSala) || idTutorSala <= 0) return { error: "Escolha o tutor" };
    if(!Number.isInteger(idAluno) || idAluno <= 0) return { error: "Escolha o aluno" };
    if(textoVazio(meta)) return { error: "O campo meta_aprendizagem é obrigatório" };

    return executarAcao(
        { metodo: "post", url: "/tutorias", corpo: { id_tutor_sala: idTutorSala, id_aluno: idAluno, meta_aprendizagem: meta.trim() } },
        "Tutoria criada!"
    )
}

// P5 - PATCH /tutorias/:id/meta (só tutoria ativa)
export async function handleEditarMeta(idTutoria: number, meta: string): Promise<ActionState> {
    if(textoVazio(meta)) return { error: "O campo meta_aprendizagem é obrigatório" };

    return executarAcao(
        { metodo: "patch", url: `/tutorias/${idTutoria}/meta`, corpo: { meta_aprendizagem: meta.trim() } },
        "Meta de aprendizagem atualizada!"
    )
}

// P6 - PATCH /tutorias/:id/finalizar (bloqueada com contestação pendente)
export async function handleFinalizarTutoria(idTutoria: number): Promise<ActionState> {
    return executarAcao(
        { metodo: "patch", url: `/tutorias/${idTutoria}/finalizar` },
        "Tutoria finalizada."
    )
}

// P7 - PATCH /tutorias/:id/reabrir (só no ano letivo atual)
export async function handleReabrirTutoria(idTutoria: number): Promise<ActionState> {
    return executarAcao(
        { metodo: "patch", url: `/tutorias/${idTutoria}/reabrir` },
        "Tutoria reaberta."
    )
}

// T4 - PATCH /contestacoes/:id/resolver. "valor" só vai quando a contestação é aceita
export async function handleResolverContestacao(
    idContestacao: number, status: "aceita" | "recusada", decisao: string, valorTexto: string
): Promise<ActionState> {
    if(textoVazio(decisao)) return { error: "O campo decisao é obrigatório" };

    const corpo: { status: string; decisao: string; valor?: number } = { status, decisao: decisao.trim() }

    if(status === "aceita"){
        const valor = validarNota(valorTexto, "valor")
        if("erro" in valor) return { error: valor.erro };

        corpo.valor = valor.valor
    }

    return executarAcao(
        { metodo: "patch", url: `/contestacoes/${idContestacao}/resolver`, corpo },
        status === "aceita" ? "Contestação aceita: a nota foi substituída." : "Contestação recusada: a nota não mudou."
    )
}
