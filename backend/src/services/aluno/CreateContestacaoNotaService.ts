import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface ContestacaoNotaRequest {
    id_nota: number;
    id_usuario: number;
    comentario?: unknown;
}

class CreateContestacaoNotaService {
    async execute({ id_nota, id_usuario, comentario }: ContestacaoNotaRequest) {

        // 1) validação do id da URL e do corpo (400), antes de qualquer consulta ao banco

        // o id da nota vem da URL (já convertido com Number no controller):
        // "abc" vira NaN e "1.5" não é inteiro, então os dois caem aqui
        if (!Number.isInteger(id_nota) || id_nota <= 0) {
            throw new AppError("O id da nota deve ser um número inteiro", 400);
        }

        // comentario é obrigatório: é o motivo da contestação
        if (typeof comentario !== "string" || comentario.trim() === "") {
            throw new AppError("O campo comentario é obrigatório", 400);
        }

        // 2) a nota existe (404)
        const nota = await prismaClient.nota.findUnique({
            where: {
                id_nota: id_nota
            },
            select: {
                id_aluno: true,
                id_atividade: true
            }
        });

        if (!nota) {
            throw new AppError("Nota não encontrada", 404);
        }

        // 3) só o aluno que recebeu a nota pode contestá-la (403).
        // o isAluno já garantiu que o id do token é de um aluno
        if (nota.id_aluno !== id_usuario) {
            throw new AppError("Você não tem permissão para contestar esta nota", 403);
        }

        // 4) RN14: só enquanto a tutoria estiver ativa (403).
        // a tutoria é a da atividade da nota com este aluno (Atividade_destinatario -> Tutoria)
        const destinatario = await prismaClient.atividade_destinatario.findFirst({
            where: {
                id_atividade: nota.id_atividade,
                tutoria: {
                    id_aluno: id_usuario
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

        if (!destinatario || destinatario.tutoria.status !== "ativa") {
            throw new AppError("A tutoria foi finalizada e não aceita contestação de nota", 403);
        }

        // 5) uma única contestação por nota, em qualquer status (pendente, aceita ou recusada) (409).
        // não há UNIQUE no banco: duas requisições simultâneas ainda poderiam passar por esta conferência
        const contestacaoExistente = await prismaClient.contestacao_nota.findFirst({
            where: {
                id_nota: id_nota
            },
            select: {
                id_contestacao: true
            }
        });

        if (contestacaoExistente) {
            throw new AppError("Esta nota já foi contestada", 409);
        }

        // status (pendente) e data_envio (now()) ficam com o default do banco.
        // a notificação ao tutor/professor (UC06 passo 02) fica de fora: não existe tabela de notificação
        const contestacao = await prismaClient.contestacao_nota.create({
            data: {
                id_nota: id_nota,
                comentario: comentario.trim()
            },
            select: {
                id_contestacao: true,
                id_nota: true,
                comentario: true,
                status: true,
                data_envio: true
            }
        });

        return contestacao;
    }
}

export { CreateContestacaoNotaService };
