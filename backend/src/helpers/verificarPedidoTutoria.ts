import prismaClient from "../prisma";

// depois de uma recusa, o aluno só pode pedir de novo NA MESMA SALA depois deste intervalo
const INTERVALO_NOVO_PEDIDO_MS = 2 * 60 * 60 * 1000; // 2 horas

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
        mensagem: "Você já é tutor nesta sala",
        status: 409
    },
    tutor_revogado: {
        codigo: "tutor_revogado",
        mensagem: "Seu cargo de tutor foi revogado nesta sala",
        status: 409
    },
    pedido_pendente: {
        codigo: "pedido_pendente",
        mensagem: "Você já tem um pedido de tutoria pendente",
        status: 409
    },
    recusa_recente: {
        codigo: "recusa_recente",
        mensagem: "Seu último pedido nesta sala foi recusado. Aguarde 2 horas para enviar um novo pedido",
        status: 409
    }
};

type ImpedimentoPedidoTutoria = typeof IMPEDIMENTOS_PEDIDO_TUTORIA[keyof typeof IMPEDIMENTOS_PEDIDO_TUTORIA];

interface SituacaoPedidoSala {
    impedimento: ImpedimentoPedidoTutoria | null;
    // só vem preenchido no impedimento recusa_recente: quando o aluno pode pedir de novo
    liberado_em: Date | null;
}

// busca de uma vez (3 consultas, independente da quantidade de salas) tudo o que impede
// o aluno de pedir tutoria e devolve uma função que diz a situação de cada sala.
// id_sala é opcional: o POST passa a sala do pedido; o GET /alunos/me/salas não passa (todas as salas).
// regras conferidas nesta ordem, devolvendo o primeiro impedimento encontrado:
// já é tutor na sala -> foi revogado na sala -> tem pedido pendente (em qualquer sala) -> recusa há menos de 2h na sala
async function buscarImpedimentosPorSala(id_aluno: number, id_sala?: number) {
    const agora = new Date();

    const [tutorSalas, pedidoPendente, recusasRecentes] = await Promise.all([
        // vínculos do aluno como tutor (ativos e revogados). sem id_sala, o Prisma ignora o filtro
        prismaClient.tutor_sala.findMany({
            where: {
                id_sala: id_sala,
                tutor: {
                    id_aluno: id_aluno
                }
            },
            select: {
                id_sala: true,
                data_revogacao: true
            }
        }),

        // só pode existir um pedido pendente por aluno (vale para todas as salas)
        prismaClient.pedido_tutoria.findFirst({
            where: {
                id_aluno: id_aluno,
                status: "pendente"
            },
            select: {
                id_pedido: true
            }
        }),

        // recusas que ainda bloqueiam: data_decisao dentro das últimas 2 horas.
        // data_decisao nula não entra no filtro "gte", então não bloqueia.
        // mais recente primeiro: o primeiro de cada sala é o que vale
        prismaClient.pedido_tutoria.findMany({
            where: {
                id_aluno: id_aluno,
                id_sala: id_sala,
                status: "recusado",
                data_decisao: {
                    gte: new Date(agora.getTime() - INTERVALO_NOVO_PEDIDO_MS)
                }
            },
            select: {
                id_sala: true,
                data_decisao: true
            },
            orderBy: {
                data_decisao: "desc"
            }
        })
    ]);

    // id_sala -> horário em que o aluno pode pedir de novo (só a recusa mais recente da sala)
    const liberacaoPorSala = new Map<number, Date>();

    for (const recusa of recusasRecentes) {
        if (recusa.data_decisao && !liberacaoPorSala.has(recusa.id_sala)) {
            liberacaoPorSala.set(recusa.id_sala, new Date(recusa.data_decisao.getTime() + INTERVALO_NOVO_PEDIDO_MS));
        }
    }

    return function situacaoDaSala(idSala: number): SituacaoPedidoSala {
        const vinculos = tutorSalas.filter((vinculo) => vinculo.id_sala === idSala);

        if (vinculos.some((vinculo) => vinculo.data_revogacao === null)) {
            return { impedimento: IMPEDIMENTOS_PEDIDO_TUTORIA.ja_e_tutor, liberado_em: null };
        }

        // a revogação só preenche data_revogacao: se sobrou vínculo, todos estão revogados
        if (vinculos.length > 0) {
            return { impedimento: IMPEDIMENTOS_PEDIDO_TUTORIA.tutor_revogado, liberado_em: null };
        }

        if (pedidoPendente) {
            return { impedimento: IMPEDIMENTOS_PEDIDO_TUTORIA.pedido_pendente, liberado_em: null };
        }

        const liberadoEm = liberacaoPorSala.get(idSala);

        if (liberadoEm && liberadoEm > agora) {
            return { impedimento: IMPEDIMENTOS_PEDIDO_TUTORIA.recusa_recente, liberado_em: liberadoEm };
        }

        return { impedimento: null, liberado_em: null };
    };
}

export { INTERVALO_NOVO_PEDIDO_MS, IMPEDIMENTOS_PEDIDO_TUTORIA, buscarImpedimentosPorSala };
