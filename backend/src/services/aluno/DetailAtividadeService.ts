import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { calcularStatusEntrega } from "../../helpers/calcularStatusEntrega";
import { podeResponderAtividade } from "../../helpers/podeResponderAtividade";
import { isTutorAtivo } from "../../middlewares/isTutorAtivoSala";

interface DetailAtividadeRequest {
    id_atividade: number;
    id_usuario: number;
    email?: string;
}

class DetailAtividadeService {
    async execute({ id_atividade, id_usuario, email }: DetailAtividadeRequest) {

        // 1) o id da atividade vem da URL (já convertido com Number no controller):
        // "abc" vira NaN e "1.5" não é inteiro, então os dois caem aqui (400)
        if (!Number.isInteger(id_atividade) || id_atividade <= 0) {
            throw new AppError("O id da atividade deve ser um número inteiro", 400);
        }

        // uma única consulta traz os dados comuns (os mesmos da A1), os destinatários
        // e a resposta e a nota do usuário logado (se ele for tutor, essas listas vêm vazias).
        // o Prisma resolve cada nível de relação com uma query em lote (WHERE ... IN (...)),
        // então o número de queries é fixo e não cresce com a quantidade de alunos (sem N+1)
        const atividade = await prismaClient.atividade.findUnique({
            where: {
                id_atividade: id_atividade
            },
            select: {
                id_atividade: true,
                id_tutor_sala: true,
                titulo: true,
                descricao: true,
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
                        sala: {
                            select: {
                                id_sala: true,
                                nome: true,
                                serie: true,
                                ano_letivo: true
                            }
                        },
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
                },
                // todos os destinatários: servem para conferir se o usuário logado é um deles
                // e, na visão do tutor, para a lista de alunos
                destinatarios: {
                    orderBy: {
                        tutoria: {
                            aluno: {
                                nome: "asc"
                            }
                        }
                    },
                    select: {
                        id_att_destinatario: true,
                        tutoria: {
                            select: {
                                status: true,
                                aluno: {
                                    select: {
                                        id_aluno: true,
                                        nome: true
                                    }
                                }
                            }
                        }
                    }
                },
                // @@unique([id_atividade, id_aluno]): no máximo 1 resposta e 1 nota
                respostas: {
                    where: {
                        id_aluno: id_usuario
                    },
                    select: {
                        id_resposta: true,
                        texto: true,
                        conteudo_file: true,
                        data_envio: true
                    }
                },
                notas: {
                    where: {
                        id_aluno: id_usuario
                    },
                    select: {
                        id_nota: true,
                        valor: true,
                        comentario: true,
                        data_lancamento: true
                    }
                }
            }
        });

        // 2) a atividade existe (404)
        if (!atividade) {
            throw new AppError("Atividade não encontrada", 404);
        }

        // sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
        if (!email) {
            throw new AppError("Você não tem permissão para acessar esta atividade", 403);
        }

        const comuns = {
            id_atividade: atividade.id_atividade,
            titulo: atividade.titulo,
            descricao: atividade.descricao,
            tipo: atividade.tipo,
            etapa: atividade.etapa,
            data_entrega: atividade.data_entrega,
            conteudo: atividade.conteudo,
            sala: atividade.tutor_sala.sala,
            tutor: {
                nome: atividade.tutor_sala.tutor.aluno.nome
            }
        };

        // 3a) aluno que recebeu a atividade (tutoria ativa ou finalizada, para ver o histórico).
        // o isAluno da rota já garantiu que o id do token é de um aluno.
        // se houver mais de uma tutoria, vale a primeira por id, a mesma que a A1
        // e o POST /atividades/:id/respostas usam
        const destinatario = atividade.destinatarios
            .filter(({ tutoria }) => tutoria.aluno.id_aluno === id_usuario)
            .sort((a, b) => a.id_att_destinatario - b.id_att_destinatario)[0];

        if (destinatario) {
            const resposta = atividade.respostas[0] ?? null;
            const nota = atividade.notas[0] ?? null;

            return {
                perfil: "aluno",
                ...comuns,
                status: calcularStatusEntrega(atividade.data_entrega, resposta?.data_envio ?? null),
                pode_responder: podeResponderAtividade(destinatario.tutoria.status, !!resposta),
                resposta,
                // valor é Decimal no Prisma e iria para o JSON como texto ("8.5"); convertemos para número
                nota: nota ? { ...nota, valor: Number(nota.valor) } : null
            };
        }

        // 3b) tutor que criou a atividade (o Tutor_sala da atividade é dele e não foi revogado).
        // respostas e notas de cada aluno não entram aqui: estão em GET /atividades/:id/respostas
        if (await isTutorAtivo({ id_usuario, email, id_tutor_sala: atividade.id_tutor_sala })) {
            return {
                perfil: "tutor",
                ...comuns,
                destinatarios: atividade.destinatarios.map(({ tutoria }) => tutoria.aluno)
            };
        }

        // 3c) qualquer outro aluno ou tutor revogado (403)
        throw new AppError("Você não tem permissão para acessar esta atividade", 403);
    }
}

export { DetailAtividadeService };
