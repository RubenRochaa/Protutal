"use server"

import { getAutenticado, ResultadoGet } from './apiServer'
import { getCookieServer, getPerfilServer } from './cookieServer'
import { AreaContador } from './ultimaVisita'
import {
    AtividadeAluno, AtividadeTutor, AvisoSala, Contestacao, DesempenhoAluno,
    MensagemTutoria, PedidoTutoria, TutoriaAluno, TutoriaTutor
} from './types'

// Dados crus dos contadores de notificação. A conta da "última visita" é feita no navegador
// (useContadores), porque o localStorage só existe lá
export interface DadosContadores {
    // Id do usuário logado (subject do token), usado só para montar a chave do localStorage
    idUsuario: string | null;
    // Contadores por status, já contados aqui (vêm do banco)
    status: {
        notificacoes?: number;
        atividades?: number;
        contestacoes?: number;
    };
    // Datas de lançamento das notas do aluno (A6)
    notas: string[];
    // Tutorias ativas com as datas das mensagens do outro participante (O2)
    tutorias: { id_tutoria: number; id_sala: number; mensagens: string[] }[];
    // Datas de publicação dos avisos de cada sala dessas tutorias (A4)
    avisos: { id_sala: number; datas: string[] }[];
}

const VAZIO: Omit<DadosContadores, "idUsuario"> = { status: {}, notas: [], tutorias: [], avisos: [] }

// Lista da resposta; se a rota falhar, aquele contador fica zerado (sem toast)
function lista<T>(resultado: ResultadoGet<T[]>){
    return "dados" in resultado ? resultado.dados : []
}

// Nenhuma rota devolve o id do usuário, mas o token traz o id no "sub".
// Aqui o token só é lido (quem confere a assinatura é a API), para separar as contas no localStorage
function idDoToken(token: string | null){
    if(!token) return null

    try {
        const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"))

        return typeof payload.sub === "string" && payload.sub ? payload.sub : null
    } catch {
        return null
    }
}

// Mensagens de cada tutoria (só as enviadas pelo outro participante) e avisos de cada sala.
// Uma chamada por tutoria e uma por sala, todas em paralelo
async function buscarChatEAvisos(tutorias: { id_tutoria: number; id_sala: number }[], remetente: "tutor" | "tutorado"){
    const salas = [...new Set(tutorias.map((tutoria) => tutoria.id_sala))]

    const [mensagens, avisos] = await Promise.all([
        Promise.all(tutorias.map((tutoria) => getAutenticado<MensagemTutoria[]>(`/tutorias/${tutoria.id_tutoria}/mensagens`))),
        Promise.all(salas.map((id_sala) => getAutenticado<AvisoSala[]>(`/salas/${id_sala}/avisos`)))
    ])

    return {
        tutorias: tutorias.map((tutoria, i) => ({
            ...tutoria,
            mensagens: lista(mensagens[i])
                .filter((mensagem) => mensagem.remetente.tipo === remetente)
                .map((mensagem) => mensagem.data_envio)
        })),
        avisos: salas.map((id_sala, i) => ({
            id_sala,
            datas: lista(avisos[i]).map((aviso) => aviso.data_publicacao)
        }))
    }
}

// Professor: pedidos de tutoria pendentes + contestações pendentes (mesmas rotas da tela Notificações)
async function contadoresProfessor(){
    const [pedidos, contestacoes] = await Promise.all([
        getAutenticado<PedidoTutoria[]>("/pedidos-tutoria"),
        getAutenticado<Contestacao[]>("/contestacoes", { status: "pendente" })
    ])

    return { ...VAZIO, status: { notificacoes: lista(pedidos).length + lista(contestacoes).length } }
}

// Aluno (tutorado): atividades pendentes, notas, mensagens do tutor e avisos das salas
async function contadoresAluno(){
    const [atividades, desempenho, tutorias] = await Promise.all([
        getAutenticado<AtividadeAluno[]>("/alunos/me/atividades", { status: "pendente" }),
        getAutenticado<DesempenhoAluno>("/alunos/me/desempenho"),
        getAutenticado<TutoriaAluno[]>("/alunos/me/tutorias", { status: "ativa" })
    ])

    const ativas = lista(tutorias).map((tutoria) => ({ id_tutoria: tutoria.id_tutoria, id_sala: tutoria.sala.id_sala }))

    return {
        // A A1 também traz as pendentes de tutorias finalizadas, que não dá mais para responder (igual ao cardPendentes)
        status: { atividades: lista(atividades).filter((atividade) => atividade.pode_responder).length },
        notas: "dados" in desempenho ? desempenho.dados.notas.map((nota) => nota.data_lancamento) : [],
        ...await buscarChatEAvisos(ativas, "tutor")
    }
}

// Tutor: respostas sem nota, contestações pendentes, mensagens dos tutorados e avisos das salas
async function contadoresTutor(){
    const [atividades, contestacoes, tutorias] = await Promise.all([
        getAutenticado<AtividadeTutor[]>("/tutores/me/atividades"),
        getAutenticado<Contestacao[]>("/contestacoes", { status: "pendente" }),
        getAutenticado<TutoriaTutor[]>("/tutores/me/tutorias", { status: "ativa" })
    ])

    // Mesmo critério do cardPendentes do tutor: entregues - com nota
    const paraCorrigir = lista(atividades)
        .reduce((total, atividade) => total + Math.max(0, atividade.total_entregues - atividade.total_com_nota), 0)

    const ativas = lista(tutorias).map((tutoria) => ({ id_tutoria: tutoria.id_tutoria, id_sala: tutoria.sala.id_sala }))

    return {
        status: { atividades: paraCorrigir, contestacoes: lista(contestacoes).length },
        notas: [],
        ...await buscarChatEAvisos(ativas, "tutorado")
    }
}

// Chamada pelo ProvedorContadores ao abrir a área, ao trocar de página e a cada 60 s.
// Perfil diferente da área (ex.: sessão trocada em outra aba): devolve null e nada acende
export async function buscarDadosContadores(area: AreaContador): Promise<DadosContadores | null> {
    const perfil = await getPerfilServer()

    if(area === "professor" ? perfil !== "professor" : perfil !== "aluno") return null

    const idUsuario = idDoToken(await getCookieServer())

    const dados = area === "professor"
        ? await contadoresProfessor()
        : area === "aluno"
            ? await contadoresAluno()
            : await contadoresTutor()

    return { idUsuario, ...dados }
}
