import prismaClient from "../../prisma";
import { parseIdOpcional } from "../../helpers/parseIdOpcional";
import { buscarImpedimentosPorSala } from "../../helpers/verificarPedidoTutoria";

interface ListSalasAlunoRequest {
    id_aluno: number;
    ano_letivo?: string;
}

class ListSalasAlunoService {
    async execute({ id_aluno, ano_letivo }: ListSalasAlunoRequest) {

        // ?ano_letivo= é opcional, mas se vier precisa ser um inteiro positivo
        const anoLetivoFiltro = parseIdOpcional(ano_letivo, "O ano letivo deve ser um número inteiro positivo");

        // consultas fixas, independente da quantidade de salas (sem uma consulta por sala):
        // as matrículas do aluno (com sala e professor) e as regras do pedido de tutoria.
        // as regras são avaliadas por sala (já é tutor / revogado / recusa recente nesta sala);
        // só "pedido pendente" vale para todas as salas;
        // sem filtro, ano_letivo fica undefined e o Prisma ignora o campo;
        // select explícito: do professor sai só o nome (sem email, senha ou tokens)
        const [matriculas, situacaoDaSala] = await Promise.all([
            prismaClient.matricula.findMany({
                where: {
                    id_aluno: id_aluno,
                    sala: {
                        ano_letivo: anoLetivoFiltro
                    }
                },
                select: {
                    sala: {
                        select: {
                            id_sala: true,
                            nome: true,
                            serie: true,
                            ano_letivo: true,
                            professor: {
                                select: {
                                    nome: true
                                }
                            }
                        }
                    }
                },
                // ano letivo mais recente primeiro e, dentro do ano, nome da sala em ordem alfabética
                orderBy: [
                    { sala: { ano_letivo: "desc" } },
                    { sala: { nome: "asc" } }
                ]
            }),
            buscarImpedimentosPorSala(id_aluno)
        ]);

        // a regra de matrícula do POST sempre passa aqui, porque só entram salas em que o aluno está matriculado.
        // se o aluno não tiver matrícula, volta lista vazia e isso não é erro
        return matriculas.map(({ sala }) => {
            const { impedimento, liberado_em } = situacaoDaSala(sala.id_sala);

            return {
                id_sala: sala.id_sala,
                nome: sala.nome,
                serie: sala.serie,
                ano_letivo: sala.ano_letivo,
                professor: sala.professor,
                pode_pedir_tutoria: impedimento === null,
                motivo: impedimento === null
                    ? null
                    : { codigo: impedimento.codigo, mensagem: impedimento.mensagem },
                // quando o aluno pode pedir de novo nesta sala (recusa recente), em ISO; senão null
                liberado_em: liberado_em ? liberado_em.toISOString() : null
            };
        });
    }
}

export { ListSalasAlunoService };
