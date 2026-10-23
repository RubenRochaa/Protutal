import prismaClient from "../../prisma";
import { Prisma } from "../../generated/prisma";
import { AppError } from "../../errors/AppError";
import { isTutorAtivo } from "../../middlewares/isTutorAtivoSala";

interface NotaRequest {
    id_atividade: number;
    id_usuario: number;
    email?: string;
    id_aluno: number;
    valor: number;
    comentario?: string;
}

class CreateNotaService {
    async execute({ id_atividade, id_usuario, email, id_aluno, valor, comentario }: NotaRequest) {

        // 1) validação do id da URL e do corpo (400), antes de qualquer consulta ao banco

        // o id da atividade vem da URL (já convertido com Number no controller)
        if (!Number.isInteger(id_atividade) || id_atividade <= 0) {
            throw new AppError("O id da atividade deve ser um número inteiro", 400);
        }

        // id_aluno é obrigatório: é o aluno que recebe a nota
        if (
            id_aluno === undefined ||
            id_aluno === null ||
            typeof id_aluno === "boolean" ||
            !Number.isInteger(Number(id_aluno)) ||
            Number(id_aluno) <= 0
        ) {
            throw new AppError("O campo id_aluno é obrigatório e deve ser um número inteiro", 400);
        }

        // valor é obrigatório e precisa ser número de verdade no JSON (não texto)
        if (typeof valor !== "number" || !Number.isFinite(valor)) {
            throw new AppError("O campo valor é obrigatório e deve ser um número", 400);
        }

        // o banco também tem um CHECK de 0 a 10
        if (valor < 0 || valor > 10) {
            throw new AppError("O valor deve estar entre 0 e 10", 400);
        }

        // a coluna é Decimal(4,2): com mais casas o banco arredondaria sem avisar
        if (Number(valor.toFixed(2)) !== valor) {
            throw new AppError("O valor deve ter no máximo 2 casas decimais", 400);
        }

        // comentario é opcional, mas se vier precisa ser texto
        if (comentario !== undefined && comentario !== null && typeof comentario !== "string") {
            throw new AppError("O campo comentario deve ser um texto", 400);
        }

        const idAluno = Number(id_aluno);

        // 2) a atividade existe (404)
        const atividade = await prismaClient.atividade.findUnique({
            where: {
                id_atividade: id_atividade
            },
            select: {
                id_tutor_sala: true,
                data_entrega: true
            }
        });

        if (!atividade) {
            throw new AppError("Atividade não encontrada", 404);
        }

        // 3) só o tutor que criou a atividade, com o vínculo Tutor_sala ainda ativo (403).
        // isTutorAtivo confere aluno por id + email, então token de professor nunca passa.
        // sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
        if (!email || !(await isTutorAtivo({ id_usuario, email, id_tutor_sala: atividade.id_tutor_sala }))) {
            throw new AppError("Você não tem permissão para lançar notas nesta atividade", 403);
        }

        // 4) o aluno precisa ser destinatário da atividade (pela tutoria dele)
        const destinatario = await prismaClient.atividade_destinatario.findFirst({
            where: {
                id_atividade: id_atividade,
                tutoria: {
                    id_aluno: idAluno
                }
            },
            select: {
                tutoria: {
                    select: {
                        status: true
                    }
                }
            }
        });

        if (!destinatario) {
            throw new AppError("O aluno informado não é destinatário desta atividade", 400);
        }

        // 5) RN14: tutoria finalizada não aceita alterações
        if (destinatario.tutoria.status !== "ativa") {
            throw new AppError("A tutoria deste aluno foi finalizada e não aceita alterações", 400);
        }

        // 6) sem resposta, a nota só pode ser lançada depois do prazo (nota por falta de entrega)
        // (usa a chave composta gerada pelo @@unique([id_atividade, id_aluno]) de Resposta)
        const resposta = await prismaClient.resposta.findUnique({
            where: {
                id_atividade_id_aluno: {
                    id_atividade: id_atividade,
                    id_aluno: idAluno
                }
            },
            select: {
                id_resposta: true
            }
        });

        if (!resposta && Date.now() <= atividade.data_entrega.getTime()) {
            throw new AppError("O aluno ainda não enviou resposta e o prazo de entrega não venceu", 400);
        }

        // 7) cada aluno tem no máximo uma nota por atividade (esta rota só cria)
        // (usa a chave composta gerada pelo @@unique([id_atividade, id_aluno]) de Nota)
        const notaExistente = await prismaClient.nota.findUnique({
            where: {
                id_atividade_id_aluno: {
                    id_atividade: id_atividade,
                    id_aluno: idAluno
                }
            },
            select: {
                id_nota: true
            }
        });

        if (notaExistente) {
            throw new AppError("Já existe nota lançada para este aluno nesta atividade", 409);
        }

        try {
            // data_lancamento fica com o default do banco (now())
            const nota = await prismaClient.nota.create({
                data: {
                    id_atividade: id_atividade,
                    id_aluno: idAluno,
                    valor: valor,
                    comentario: typeof comentario === "string" && comentario.trim() !== "" ? comentario.trim() : null
                },
                select: {
                    id_nota: true,
                    id_atividade: true,
                    id_aluno: true,
                    valor: true,
                    comentario: true,
                    data_lancamento: true
                }
            });

            // valor é Decimal no Prisma e iria para o JSON como texto ("8.5"); convertemos para número
            return { ...nota, valor: Number(nota.valor) };
        } catch (err) {
            // P2002 = violação de UNIQUE: duas notas iguais chegaram ao mesmo tempo
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError("Já existe nota lançada para este aluno nesta atividade", 409);
            }

            throw err;
        }
    }
}

export { CreateNotaService };
