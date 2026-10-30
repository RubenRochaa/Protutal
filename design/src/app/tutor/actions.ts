"use server"

import { revalidatePath } from 'next/cache'
import { api } from '@/services/api'
import { getCookieServer } from '@/lib/cookieServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaAction } from '@/lib/sessaoExpirada'
import { executarAcao } from '@/lib/acaoServidor'
import { textoVazio, validarNota } from '@/lib/validacao'
import { ActionState, AtividadeCriada } from '@/lib/types'

// Cada ação valida de novo no servidor (o navegador pode ter sido burlado) com as mesmas
// regras e mensagens do back-end. O executarAcao só atualiza a área do professor,
// por isso as ações daqui atualizam a área do tutor depois do sucesso.
function atualizarAreaTutor(resultado: ActionState): ActionState {
    if(resultado.sucesso) revalidatePath("/tutor", "layout")

    return resultado
}

function idValido(valor: number){
    return Number.isInteger(valor) && valor > 0
}

// ---------- O1 - POST /tutorias/:id/mensagens ----------
// Com "assunto", a mensagem vira comunicado (só o tutor pode enviar)
export async function handleEnviarMensagem(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const idTutoria = Number(formData.get("id_tutoria"))
    const texto = String(formData.get("texto") ?? "").trim()
    const comunicado = formData.get("comunicado") === "on"
    const assunto = String(formData.get("assunto") ?? "").trim()

    const valores = { texto, assunto, comunicado: comunicado ? "on" : "" }

    if(!idValido(idTutoria)) return { error: "O id da tutoria deve ser um número inteiro", valores };
    if(texto === "") return { error: "O campo texto é obrigatório e não pode ser vazio", valores };

    if(comunicado){
        if(assunto === "") return { error: "O campo assunto não pode ser vazio", valores };
        if(assunto.length > 150) return { error: "O assunto deve ter no máximo 150 caracteres", valores };
    }

    const resultado = await executarAcao(
        { metodo: "post", url: `/tutorias/${idTutoria}/mensagens`, corpo: comunicado ? { texto, assunto } : { texto } },
        comunicado ? "Comunicado enviado!" : "Mensagem enviada!"
    )

    return resultado.error ? { ...resultado, valores } : atualizarAreaTutor(resultado)
}

// ---------- T9 - POST /atividades ----------
// Não usa o executarAcao porque precisa do id_atividade da resposta para abrir o detalhe
const TIPOS_ETAPA = ["1", "2", "3"]

// "2026-11-10T23:59" (datetime-local, horário de São Paulo) -> ISO em UTC.
// São Paulo está em UTC-3 o ano todo (sem horário de verão desde 2019)
function prazoParaIso(prazo: string): string | null {
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(prazo)) return null

    const data = new Date(`${prazo}:00-03:00`)

    return Number.isNaN(data.getTime()) ? null : data.toISOString()
}

export async function handleCriarAtividade(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const idTutoria = Number(formData.get("id_tutoria"))
    const idConteudo = String(formData.get("id_conteudo") ?? "")
    const titulo = String(formData.get("titulo") ?? "").trim()
    const descricao = String(formData.get("descricao") ?? "").trim()
    const tipo = String(formData.get("tipo") ?? "")
    const etapa = String(formData.get("etapa") ?? "")
    const prazo = String(formData.get("prazo") ?? "")

    const valores = { id_conteudo: idConteudo, titulo, descricao, tipo, etapa, prazo }

    if(!idValido(idTutoria)) return { error: "O campo id_tutoria é obrigatório e deve ser um número inteiro", valores };
    if(!idValido(Number(idConteudo))) return { error: "O campo id_conteudo é obrigatório e deve ser um número inteiro", valores };
    if(titulo === "") return { error: "O campo titulo é obrigatório", valores };
    if(titulo.length > 150) return { error: "O titulo deve ter no máximo 150 caracteres", valores };
    if(tipo === "") return { error: "O campo tipo é obrigatório", valores };
    if(!TIPOS_ETAPA.includes(etapa)) return { error: "O campo etapa é obrigatório e deve ser 1, 2 ou 3", valores };
    if(prazo === "") return { error: "O campo prazo é obrigatório", valores };

    const prazoIso = prazoParaIso(prazo)
    if(!prazoIso) return { error: "O campo prazo deve ser uma data válida", valores };
    if(new Date(prazoIso) <= new Date()) return { error: "O prazo deve ser uma data futura", valores };

    const token = await getCookieServer()
    let erro: unknown
    let criada: AtividadeCriada | null = null

    try {
        const response = await api.post<AtividadeCriada>("/atividades", {
            id_tutoria: idTutoria,
            id_conteudo: Number(idConteudo),
            titulo,
            ...(descricao ? { descricao } : {}),
            tipo,
            etapa: Number(etapa),
            prazo: prazoIso
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })

        criada = response.data
    } catch(err) {
        erro = err
    }

    if(erro || !criada){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        await sessaoExpiradaNaAction(erro)

        return { error: getErrorMessage(erro), valores }
    }

    revalidatePath("/tutor", "layout")

    return { sucesso: "Atividade criada!", redirecionar: `/tutor/atividades/${criada.id_atividade}` }
}

// ---------- T3 - POST /atividades/:id/notas ----------
// Uma nota por aluno, sem edição (409). O valor chega como texto (aceita vírgula)
export async function handleLancarNota(idAtividade: number, idAluno: number, valorTexto: string, comentario: string): Promise<ActionState> {
    if(!idValido(idAtividade)) return { error: "O id da atividade deve ser um número inteiro" };
    if(!idValido(idAluno)) return { error: "O campo id_aluno é obrigatório e deve ser um número inteiro" };

    const valor = validarNota(valorTexto, "valor")
    if("erro" in valor) return { error: valor.erro };

    const resultado = await executarAcao(
        {
            metodo: "post",
            url: `/atividades/${idAtividade}/notas`,
            corpo: { id_aluno: idAluno, valor: valor.valor, ...(textoVazio(comentario) ? {} : { comentario: comentario.trim() }) }
        },
        "Nota lançada!"
    )

    return atualizarAreaTutor(resultado)
}

// ---------- T5 - POST /salas/:id/materiais (multipart) ----------
const MSG_SEM_ARQUIVO = "O arquivo do material é obrigatório (campo file)"

export async function handleAnexarMaterial(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const idSala = Number(formData.get("id_sala"))
    const titulo = String(formData.get("titulo") ?? "").trim()
    const descricao = String(formData.get("descricao") ?? "").trim()
    const arquivo = formData.get("file")

    // O arquivo não dá para devolver: o tutor escolhe de novo
    const valores = { titulo, descricao }

    if(!idValido(idSala)) return { error: "O id da sala deve ser um número inteiro", valores };
    if(titulo === "") return { error: "O título do material é obrigatório", valores };
    if(titulo.length > 150) return { error: "O título do material deve ter no máximo 150 caracteres", valores };

    // Sem arquivo escolhido, o navegador manda um File vazio (sem nome e com 0 bytes)
    if(!(arquivo instanceof File) || arquivo.size === 0) return { error: MSG_SEM_ARQUIVO, valores };

    // FormData novo só com os campos da T5 (o id da sala vai na URL)
    const corpo = new FormData()
    corpo.append("titulo", titulo)
    if(descricao !== "") corpo.append("descricao", descricao)
    corpo.append("file", arquivo, arquivo.name)

    const token = await getCookieServer()
    let erro: unknown

    try {
        await api.post(`/salas/${idSala}/materiais`, corpo, {
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

    revalidatePath("/tutor", "layout")

    return { sucesso: "Material anexado!" }
}

// ---------- T4 - PATCH /contestacoes/:id/resolver ----------
// "valor" só vai quando a contestação é aceita (com "recusada" a API recusa o campo)
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

    const resultado = await executarAcao(
        { metodo: "patch", url: `/contestacoes/${idContestacao}/resolver`, corpo },
        status === "aceita" ? "Contestação aceita: a nota foi substituída." : "Contestação recusada: a nota não mudou."
    )

    return atualizarAreaTutor(resultado)
}
