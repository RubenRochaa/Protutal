"use server"

import { revalidatePath } from 'next/cache'
import { api } from '@/services/api'
import { getCookieServer } from '@/lib/cookieServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaAction } from '@/lib/sessaoExpirada'
import { AlunoSala, ActionState } from '@/lib/types'

// Menos que isso traz quase todos os alunos do sistema: a tela nem chama a API.
// Fica igual ao MINIMO_BUSCA do modal (um arquivo "use server" só pode exportar funções)
const MINIMO_BUSCA = 2

// Roda no servidor: busca alunos pelo nome ou e-mail (rota P21 - GET /alunos?busca=).
// É chamada pelo modal "Adicionar alunos" enquanto o professor digita.
export async function buscarAlunos(busca: string): Promise<{ alunos: AlunoSala[] } | { error: string }> {
    const termo = busca.trim()

    // Valida de novo aqui: o navegador pode ter sido burlado
    if(termo.length < MINIMO_BUSCA) return { error: `Digite pelo menos ${MINIMO_BUSCA} letras para buscar` };

    const token = await getCookieServer()
    let erro: unknown

    try {
        const response = await api.get<AlunoSala[]>("/alunos", {
            params: { busca: termo },
            headers: { Authorization: `Bearer ${token}` }
        })

        return { alunos: response.data }
    } catch(err) {
        erro = err
    }

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    await sessaoExpiradaNaAction(erro)

    return { error: getErrorMessage(erro) }
}

// Roda no servidor: matricula o aluno na sala (rota P22 - POST /salas/:id/matriculas).
// A API recusa aluno já matriculado nesta sala ou em outra sala do mesmo ano letivo (409).
export async function handleMatricular(idSala: number, idAluno: number): Promise<ActionState> {
    // Mesma mensagem do back-end (P22)
    if(!Number.isInteger(idAluno) || idAluno <= 0) {
        return { error: "O campo id_aluno é obrigatório e deve ser um número inteiro" };
    }

    const token = await getCookieServer()
    let erro: unknown

    try {
        await api.post(`/salas/${idSala}/matriculas`, { id_aluno: idAluno }, {
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch(err) {
        erro = err
    }

    if(erro){
        await sessaoExpiradaNaAction(erro)

        return { error: getErrorMessage(erro) }
    }

    // A aba busca a lista de novo, já com o aluno novo
    revalidatePath(`/professor/salas/${idSala}/alunos`)

    return { sucesso: "Aluno matriculado com sucesso!" }
}
