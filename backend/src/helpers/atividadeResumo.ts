import { Prisma } from "../generated/prisma";

// parte comum do resumo de atividade usado nas listagens
// (P11 GET /salas/:id/atividades e T2 GET /tutores/me/atividades).
// cada service acrescenta o próprio bloco (tutor ou sala) ao select e à resposta.
// as contagens vêm do _count na mesma consulta (subconsultas COUNT no SQL),
// então o número de queries não cresce com a quantidade de atividades (sem N+1)
const selectAtividadeResumo = {
    id_atividade: true,
    titulo: true,
    tipo: true,
    etapa: true,
    data_entrega: true,
    conteudo: {
        select: {
            id_conteudo: true,
            nome: true
        }
    },
    _count: {
        select: {
            destinatarios: true,
            respostas: true,
            notas: true
        }
    }
} satisfies Prisma.AtividadeSelect;

type AtividadeResumo = Prisma.AtividadeGetPayload<{ select: typeof selectAtividadeResumo }>;

// campos que vêm antes do bloco próprio de cada listagem
function camposAtividadeResumo(atividade: AtividadeResumo) {
    return {
        id_atividade: atividade.id_atividade,
        titulo: atividade.titulo,
        tipo: atividade.tipo,
        etapa: atividade.etapa,
        data_entrega: atividade.data_entrega,
        conteudo: atividade.conteudo
    };
}

// achata o _count, deixando a resposta mais simples para o front
function contagensAtividade(atividade: AtividadeResumo) {
    return {
        total_destinatarios: atividade._count.destinatarios,
        total_entregues: atividade._count.respostas,
        total_com_nota: atividade._count.notas
    };
}

export { selectAtividadeResumo, camposAtividadeResumo, contagensAtividade };
