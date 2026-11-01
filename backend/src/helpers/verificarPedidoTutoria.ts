import prismaClient from "../prisma";

// regras de quem pode pedir tutoria, usadas pelo POST /pedidos-tutoria (que lança o erro)
// e pelo GET /alunos/me/salas (que só informa se o aluno pode pedir em cada sala).
// codigo vai para o front; mensagem e status são os mesmos que o POST devolve
const IMPEDIMENTOS_PEDIDO_TUTORIA = {
    nao_matriculado: {
        codigo: "nao_matriculado",
        mensagem: "Você não está matriculado nesta sala",
        status: 400
    },
    ja_e_tutor: {
        codigo: "ja_e_tutor",
        mensagem: "Você já é tutor",
        status: 409
    },
    pedido_pendente: {
        codigo: "pedido_pendente",
        mensagem: "Você já tem um pedido de tutoria pendente",
        status: 409
    }
};

type ImpedimentoPedidoTutoria = typeof IMPEDIMENTOS_PEDIDO_TUTORIA[keyof typeof IMPEDIMENTOS_PEDIDO_TUTORIA];

// regras que dependem só do aluno (não da sala), conferidas nesta ordem:
// já é tutor -> tem pedido pendente. devolve o primeiro impedimento encontrado ou null
async function buscarImpedimentoAluno(id_aluno: number): Promise<ImpedimentoPedidoTutoria | null> {

    // Tutor.id_aluno é único: quem já é tutor não pode pedir de novo
    const tutor = await prismaClient.tutor.findUnique({
        where: {
            id_aluno: id_aluno
        },
        select: {
            id_tutor: true
        }
    });

    if (tutor) {
        return IMPEDIMENTOS_PEDIDO_TUTORIA.ja_e_tutor;
    }

    // só pode existir um pedido pendente por aluno
    const pedidoPendente = await prismaClient.pedido_tutoria.findFirst({
        where: {
            id_aluno: id_aluno,
            status: "pendente"
        },
        select: {
            id_pedido: true
        }
    });

    if (pedidoPendente) {
        return IMPEDIMENTOS_PEDIDO_TUTORIA.pedido_pendente;
    }

    return null;
}

export { IMPEDIMENTOS_PEDIDO_TUTORIA, buscarImpedimentoAluno };
