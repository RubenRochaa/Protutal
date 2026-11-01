import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { parseIdOpcional } from "../../helpers/parseIdOpcional";
import { calcularDesempenhoTutor } from "../../helpers/calcularDesempenhoTutor";

interface DesempenhoTutorRequest {
    id_aluno: number;
    email: string;
    id_sala?: string;
}

// desempenho do próprio tutor (RF23 / UC20): os mesmos dois indicadores da P13
// (feedback dos alunos com média geral e por etapa; avaliações do professor só com média geral),
// um item por vínculo Tutor_sala, com as listas de feedbacks e avaliações
class DesempenhoTutorService {
    async execute({ id_aluno, email, id_sala }: DesempenhoTutorRequest) {

        // filtro opcional da query string: se vier, precisa ser um inteiro positivo (400)
        const idSalaFiltro = parseIdOpcional(id_sala, "O id da sala deve ser um número inteiro");

        // sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
        if (!email) {
            throw new AppError("Acesso permitido somente para tutores com vínculo ativo", 403);
        }

        // todos os vínculos do tutor logado, inclusive os revogados (mesmo critério do GET /feedbacks):
        // o histórico continua sendo dele. ?id_sala= de uma sala que não é dele volta lista vazia.
        // uma única consulta: tutorias, feedbacks e avaliações vêm juntos pelo select (sem N+1);
        // do aluno e do professor sai só o nome (sem email, senha ou tokens);
        // notas dos alunos tutorados (Nota) não entram no desempenho do tutor
        const vinculos = await prismaClient.tutor_sala.findMany({
            where: {
                id_sala: idSalaFiltro,
                tutor: {
                    aluno: {
                        id_aluno: id_aluno,
                        email: email
                    }
                }
            },
            select: {
                id_tutor_sala: true,
                data_revogacao: true,
                sala: {
                    select: {
                        id_sala: true,
                        nome: true,
                        serie: true,
                        ano_letivo: true
                    }
                },
                // caminho do feedback até o vínculo: Feedback -> Tutoria -> Tutor_sala
                tutorias: {
                    select: {
                        aluno: {
                            select: {
                                nome: true
                            }
                        },
                        feedbacks: {
                            select: {
                                id_feedback: true,
                                etapa: true,
                                nota: true,
                                comentario: true,
                                rubrica_file: true,
                                data: true
                            }
                        }
                    }
                },
                avaliacoes: {
                    select: {
                        id_avaliacao: true,
                        nota: true,
                        comentario: true,
                        data: true,
                        professor: {
                            select: {
                                nome: true
                            }
                        }
                    },
                    // da mais recente para a mais antiga; o id desempata avaliações no mesmo instante
                    orderBy: [
                        { data: "desc" },
                        { id_avaliacao: "desc" }
                    ]
                }
            }
        });

        // nota é Decimal no Prisma (viria como texto no JSON), então convertemos para número
        const desempenho = vinculos.map((vinculo) => {
            // achata os feedbacks de todas as tutorias do vínculo, cada um com o nome do aluno que escreveu;
            // como vêm de tutorias diferentes, a ordem (mais recente primeiro) é feita aqui
            const feedbacks = vinculo.tutorias
                .flatMap((tutoria) => tutoria.feedbacks.map((feedback) => ({
                    id_feedback: feedback.id_feedback,
                    etapa: feedback.etapa,
                    nota: Number(feedback.nota),
                    comentario: feedback.comentario,
                    rubrica_file: feedback.rubrica_file,
                    data: feedback.data,
                    aluno: {
                        nome: tutoria.aluno.nome
                    }
                })))
                .sort((a, b) => b.data.getTime() - a.data.getTime() || b.id_feedback - a.id_feedback);

            const avaliacoes = vinculo.avaliacoes.map((avaliacao) => ({
                id_avaliacao: avaliacao.id_avaliacao,
                nota: Number(avaliacao.nota),
                comentario: avaliacao.comentario,
                data: avaliacao.data,
                professor: {
                    nome: avaliacao.professor.nome
                }
            }));

            // mesmos indicadores da P13 (helper compartilhado)
            const indicadores = calcularDesempenhoTutor(feedbacks, avaliacoes.map((avaliacao) => avaliacao.nota));

            return {
                id_tutor_sala: vinculo.id_tutor_sala,
                sala: vinculo.sala,
                revogado: vinculo.data_revogacao !== null,
                data_revogacao: vinculo.data_revogacao,
                feedback: {
                    ...indicadores.feedback,
                    feedbacks
                },
                avaliacoes_professor: {
                    ...indicadores.avaliacoes_professor,
                    avaliacoes
                }
            };
        });

        // ativos primeiro, depois ano letivo mais recente; o id desempata vínculos do mesmo ano
        return desempenho.sort((a, b) =>
            Number(a.revogado) - Number(b.revogado)
            || b.sala.ano_letivo - a.sala.ano_letivo
            || b.id_tutor_sala - a.id_tutor_sala
        );
    }
}

export { DesempenhoTutorService };
