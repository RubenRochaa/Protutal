"use server"

import { revalidatePath } from 'next/cache'
import { api } from '@/services/api'
import { getCookieServer } from '@/lib/cookieServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaAction } from '@/lib/sessaoExpirada'
import { ActionState } from '@/lib/types'

// Lê um id inteiro positivo do formulário (vem como texto). Inválido = null
function lerId(formData: FormData, campo: string): number | null {
    const id = Number(formData.get(campo))

    return Number.isInteger(id) && id > 0 ? id : null
}

// Roda no servidor: o aluno tutorado envia uma mensagem no chat (rota O1 - POST /tutorias/:id/mensagens).
// Só vai o "texto": "assunto" é do comunicado, que só o tutor envia (com ele a API responde 403)
export async function handleEnviarMensagem(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const idTutoria = lerId(formData, "id_tutoria")
    const texto = String(formData.get("texto") ?? "").trim()
    const valores = { texto }

    if(idTutoria === null) return { error: "O id da tutoria deve ser um número inteiro", valores }

    // Mesma regra da O1: não pode ser vazio nem só espaços
    if(texto === "") return { error: "Escreva a mensagem antes de enviar.", valores }

    const token = await getCookieServer()
    let erro: unknown

    try {
        await api.post(`/tutorias/${idTutoria}/mensagens`, { texto }, {
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch(err) {
        erro = err
    }

    if(erro){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        await sessaoExpiradaNaAction(erro)

        // 409 = a tutoria foi finalizada (ex.: pelo professor, com a tela aberta):
        // atualiza a página para o campo de envio dar lugar ao aviso
        if(getErrorStatus(erro) === 409) revalidatePath(`/aluno/tutoria/${idTutoria}/chat`)

        return { error: getErrorMessage(erro), valores }
    }

    revalidatePath(`/aluno/tutoria/${idTutoria}/chat`)

    return { sucesso: "Mensagem enviada!" }
}

// Mesmas regras da A10: nota de 0 a 10 com até 2 casas, separadas por ponto
const NOTA_VALIDA = /^\d+(\.\d{1,2})?$/
const ETAPAS_VALIDAS = ["1", "2", "3"]

// Roda no servidor: o aluno tutorado avalia o tutor (rota A10 - POST /tutorias/:id/feedbacks).
// multipart/form-data: etapa, nota, comentario (opcional) e file (rubrica, obrigatório)
export async function handleEnviarFeedback(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const idTutoria = lerId(formData, "id_tutoria")
    const etapa = String(formData.get("etapa") ?? "")
    // O aluno pode digitar "8,5": a A10 só aceita ponto, então trocamos antes de enviar
    const notaDigitada = String(formData.get("nota") ?? "").trim()
    const nota = notaDigitada.replace(",", ".")
    const comentario = String(formData.get("comentario") ?? "").trim()
    const arquivo = formData.get("file")

    // O arquivo não dá para devolver: o aluno escolhe de novo
    const valores = { etapa, nota: notaDigitada, comentario }

    // Valida de novo aqui: o navegador pode ter sido burlado
    if(idTutoria === null) return { error: "O id da tutoria deve ser um número inteiro", valores }
    if(!ETAPAS_VALIDAS.includes(etapa)) return { error: "Escolha a etapa (1ª, 2ª ou 3ª).", valores }
    if(!NOTA_VALIDA.test(nota) || Number(nota) > 10){
        return { error: "A nota deve ser de 0 a 10, com no máximo 2 casas decimais.", valores }
    }
    if(!(arquivo instanceof File) || arquivo.size === 0){
        return { error: "O arquivo da rubrica é obrigatório (campo file)", valores }
    }

    // FormData novo só com os campos da A10. Comentário em branco não vai (a API recusaria vazio)
    const corpo = new FormData()
    corpo.append("etapa", etapa)
    corpo.append("nota", nota)
    if(comentario !== "") corpo.append("comentario", comentario)
    corpo.append("file", arquivo, arquivo.name)

    const token = await getCookieServer()
    let erro: unknown

    try {
        await api.post(`/tutorias/${idTutoria}/feedbacks`, corpo, {
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch(err) {
        erro = err
    }

    if(erro){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        await sessaoExpiradaNaAction(erro)

        // 409 "tutoria finalizada" ou "já existe feedback nesta etapa", 403 "não é o tutorado":
        // a mensagem da API vai para o toast
        return { error: getErrorMessage(erro), valores }
    }

    revalidatePath(`/aluno/tutoria/${idTutoria}`)

    return { sucesso: "Avaliação enviada!", redirecionar: `/aluno/tutoria/${idTutoria}` }
}

// Roda no servidor: o aluno pede para ser tutor numa sala em que está matriculado
// (rota A13 - POST /pedidos-tutoria). O professor da sala aceita ou recusa depois
export async function handlePedirTutoria(_estado: ActionState, formData: FormData): Promise<ActionState> {
    const idSala = lerId(formData, "id_sala")

    if(idSala === null) return { error: "O campo id_sala é obrigatório e deve ser um número inteiro" }

    const token = await getCookieServer()
    let erro: unknown

    try {
        await api.post("/pedidos-tutoria", { id_sala: idSala }, {
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch(err) {
        erro = err
    }

    if(erro){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        await sessaoExpiradaNaAction(erro)

        // 409 = já é tutor ou já tem pedido pendente (ex.: pedido feito em outra aba):
        // atualiza a lista para os botões mostrarem o motivo
        if(getErrorStatus(erro) === 409) revalidatePath("/aluno/tutoria")

        return { error: getErrorMessage(erro) }
    }

    // A GET /alunos/me/salas passa a devolver "pedido pendente": os botões ficam desabilitados
    revalidatePath("/aluno/tutoria")

    return { sucesso: "Pedido enviado ao professor!" }
}
