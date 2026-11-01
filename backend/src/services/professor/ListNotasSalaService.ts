import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { parseIdOpcional } from "../../helpers/parseIdOpcional";

interface ListNotasSalaRequest {
    id_sala: number;
    id_professor: number;
    etapa?: string;
    id_conteudo?: string;
    id_aluno?: string;
    id_tutor_sala?: string;
}

// só consulta (RF15): quem lança nota é o tutor (POST /atividades/:id/notas).
// a exportação para Excel (P15) chama este mesmo service e monta a planilha a partir do retorno
class ListNotasSalaService {
    async execute({ id_sala, id_professor, etapa, id_conteudo, id_aluno, id_tutor_sala }: ListNotasSalaRequest) {

        // o id da sala vem da URL (/salas/:id/notas) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

        // filtros opcionais da query string: se vierem, precisam ser válidos
        // (conferidos antes de buscar a sala, para o 400 vir antes do 404 e do 403)
        let etapaFiltro: number | undefined;

        if (etapa !== undefined) {
            etapaFiltro = Number(etapa);

            if (![1, 2, 3].includes(etapaFiltro)) {
                throw new AppError("A etapa deve ser 1, 2 ou 3", 400);
            }
        }

        const idConteudoFiltro = parseIdOpcional(id_conteudo, "O id do conteúdo deve ser um número inteiro");
        const idAlunoFiltro = parseIdOpcional(id_aluno, "O id do aluno deve ser um número inteiro");
        const idTutorSalaFiltro = parseIdOpcional(id_tutor_sala, "O id do tutor da sala deve ser um número inteiro");

        const sala = await prismaClient.sala.findUnique({
            where: {
                id_sala: id_sala
            },
            select: {
                id_sala: true,
                id_professor: true
            }
        });

        if (!sala) {
            throw new AppError("Sala não encontrada", 404);
        }

        // o professor só pode ver as notas das próprias salas (RN07)
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // notas lançadas nas atividades desta sala (Nota -> Atividade -> Tutor_sala -> Sala);
        // a consulta parte de Nota, então aluno sem nota não aparece.
        // filtros ausentes ficam undefined e o Prisma ignora o campo.
        // a contestação pendente vem do _count filtrado na mesma consulta (subconsulta COUNT no SQL),
        // então o número de queries não cresce com a quantidade de notas (sem N+1);
        // se o filtro não achar nada, volta lista vazia e isso não é erro
        const notas = await prismaClient.nota.findMany({
            where: {
                id_aluno: idAlunoFiltro,
                atividade: {
                    tutor_sala: {
                        id_sala: id_sala
                    },
                    etapa: etapaFiltro,
                    id_conteudo: idConteudoFiltro,
                    id_tutor_sala: idTutorSalaFiltro
                }
            },
            // nome do aluno -> etapa -> data de entrega; id_nota só desempata
            orderBy: [
                { aluno: { nome: "asc" } },
                { atividade: { etapa: "asc" } },
                { atividade: { data_entrega: "asc" } },
                { id_nota: "asc" }
            ],
            select: {
                id_nota: true,
                valor: true,
                comentario: true,
                data_lancamento: true,
                aluno: {
                    select: {
                        id_aluno: true,
                        nome: true
                    }
                },
                atividade: {
                    select: {
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
                        tutor_sala: {
                            select: {
                                id_tutor_sala: true,
                                tutor: {
                                    select: {
                                        aluno: {
                                            select: {
                                                nome: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        contestacoes: {
                            where: {
                                status: "pendente"
                            }
                        }
                    }
                }
            }
        });

        // achata atividade.conteudo e atividade.tutor_sala.tutor.aluno, deixando uma linha por nota;
        // o valor vem como Decimal do Prisma e é convertido para número
        return notas.map((nota) => ({
            id_nota: nota.id_nota,
            valor: Number(nota.valor),
            comentario: nota.comentario,
            data_lancamento: nota.data_lancamento,
            aluno: nota.aluno,
            atividade: {
                id_atividade: nota.atividade.id_atividade,
                titulo: nota.atividade.titulo,
                tipo: nota.atividade.tipo,
                etapa: nota.atividade.etapa,
                data_entrega: nota.atividade.data_entrega
            },
            conteudo: nota.atividade.conteudo,
            tutor: {
                id_tutor_sala: nota.atividade.tutor_sala.id_tutor_sala,
                nome: nota.atividade.tutor_sala.tutor.aluno.nome
            },
            contestacao_pendente: nota._count.contestacoes > 0
        }));
    }
}

export { ListNotasSalaService };
