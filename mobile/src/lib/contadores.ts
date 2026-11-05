import { api } from "../services/api";
import { AreaContador } from "./ultimaVisita";
import {
    AtividadeAluno, AtividadeTutor, AvisoSala, ContestacaoTutor, DesempenhoAluno,
    MensagemTutoria, PedidoTutoria, TutoriaAluno, TutoriaTutor
} from "./types";

// Dados crus dos contadores de notificação, com as mesmas rotas do site (design/src/lib/contadoresActions.ts).
// No site a busca roda numa Server Action (o token fica num cookie); aqui o axios já leva o token.
// A conta da "última visita" é feita no useContadores
export interface DadosContadores {
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

const VAZIO: DadosContadores = { status: {}, notas: [], tutorias: [], avisos: [] }

// GET que devolve lista; se a rota falhar, aquele contador fica zerado (sem toast)
function lista<T>(rota: string, params?: object){
    return api.get<T[]>(rota, { params }).then((r) => r.data).catch(() => [] as T[])
}

// Mensagens de cada tutoria (só as enviadas pelo outro participante) e avisos de cada sala.
// Uma chamada por tutoria e uma por sala, todas em paralelo
async function buscarChatEAvisos(tutorias: { id_tutoria: number; id_sala: number }[], remetente: "tutor" | "tutorado"){
    const salas = [...new Set(tutorias.map((tutoria) => tutoria.id_sala))]

    const [mensagens, avisos] = await Promise.all([
        Promise.all(tutorias.map((tutoria) => lista<MensagemTutoria>(`/tutorias/${tutoria.id_tutoria}/mensagens`))),
        Promise.all(salas.map((id_sala) => lista<AvisoSala>(`/salas/${id_sala}/avisos`)))
    ])

    return {
        tutorias: tutorias.map((tutoria, i) => ({
            ...tutoria,
            mensagens: mensagens[i]
                .filter((mensagem) => mensagem.remetente.tipo === remetente)
                .map((mensagem) => mensagem.data_envio)
        })),
        avisos: salas.map((id_sala, i) => ({
            id_sala,
            datas: avisos[i].map((aviso) => aviso.data_publicacao)
        }))
    }
}

// Professor: pedidos de tutoria pendentes + contestações pendentes (mesmas rotas da tela Notificações)
async function contadoresProfessor(): Promise<DadosContadores> {
    const [pedidos, contestacoes] = await Promise.all([
        lista<PedidoTutoria>("/pedidos-tutoria"),
        lista<ContestacaoTutor>("/contestacoes", { status: "pendente" })
    ])

    return { ...VAZIO, status: { notificacoes: pedidos.length + contestacoes.length } }
}

// Aluno (tutorado): atividades pendentes, notas, mensagens do tutor e avisos das salas
async function contadoresAluno(): Promise<DadosContadores> {
    const [atividades, desempenho, tutorias] = await Promise.all([
        lista<AtividadeAluno>("/alunos/me/atividades", { status: "pendente" }),
        api.get<DesempenhoAluno>("/alunos/me/desempenho").then((r) => r.data).catch(() => null),
        lista<TutoriaAluno>("/alunos/me/tutorias", { status: "ativa" })
    ])

    const ativas = tutorias.map((tutoria) => ({ id_tutoria: tutoria.id_tutoria, id_sala: tutoria.sala.id_sala }))

    return {
        // A A1 também traz as pendentes de tutorias finalizadas, que não dá mais para responder
        status: { atividades: atividades.filter((atividade) => atividade.pode_responder).length },
        notas: desempenho ? desempenho.notas.map((nota) => nota.data_lancamento) : [],
        ...await buscarChatEAvisos(ativas, "tutor")
    }
}

// Tutor: respostas sem nota, contestações pendentes, mensagens dos tutorados e avisos das salas
async function contadoresTutor(): Promise<DadosContadores> {
    const [atividades, contestacoes, tutorias] = await Promise.all([
        lista<AtividadeTutor>("/tutores/me/atividades"),
        lista<ContestacaoTutor>("/contestacoes", { status: "pendente" }),
        lista<TutoriaTutor>("/tutores/me/tutorias", { status: "ativa" })
    ])

    // Mesmo critério do card de pendentes do tutor: entregues - com nota
    const paraCorrigir = atividades
        .reduce((total, atividade) => total + Math.max(0, atividade.total_entregues - atividade.total_com_nota), 0)

    const ativas = tutorias.map((tutoria) => ({ id_tutoria: tutoria.id_tutoria, id_sala: tutoria.sala.id_sala }))

    return {
        status: { atividades: paraCorrigir, contestacoes: contestacoes.length },
        notas: [],
        ...await buscarChatEAvisos(ativas, "tutorado")
    }
}

// Chamada pelo ProvedorContadores ao abrir a área, quando uma tela ganha foco e a cada 60 s
export function buscarDadosContadores(area: AreaContador){
    if(area === "professor") return contadoresProfessor()
    if(area === "aluno") return contadoresAluno()

    return contadoresTutor()
}
