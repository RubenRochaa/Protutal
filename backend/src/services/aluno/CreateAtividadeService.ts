import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface AtividadeRequest {
    id_aluno: number;
    id_tutoria: number;
    id_conteudo: number;
    titulo: string;
    descricao?: string;
    tipo?: string;
    prazo: string;
}

class CreateAtividadeService {
    async execute({ id_aluno, id_tutoria, id_conteudo, titulo, descricao, tipo, prazo }: AtividadeRequest) {

        // id_tutoria é obrigatório: identifica o aluno tutorado que vai receber a atividade
        if (id_tutoria === undefined || id_tutoria === null || !Number.isInteger(Number(id_tutoria)) || Number(id_tutoria) <= 0) {
            throw new AppError("O campo id_tutoria é obrigatório e deve ser um número inteiro", 400);
        }

        if (id_conteudo === undefined || id_conteudo === null || !Number.isInteger(Number(id_conteudo)) || Number(id_conteudo) <= 0) {
            throw new AppError("O campo id_conteudo é obrigatório e deve ser um número inteiro", 400);
        }

        // titulo é obrigatório e a coluna aceita no máximo 150 caracteres
        if (typeof titulo !== "string" || titulo.trim() === "") {
            throw new AppError("O campo titulo é obrigatório", 400);
        }

        if (titulo.trim().length > 150) {
            throw new AppError("O titulo deve ter no máximo 150 caracteres", 400);
        }

        // descricao e tipo são opcionais no schema, mas se vierem precisam ser texto
        if (descricao !== undefined && descricao !== null && typeof descricao !== "string") {
            throw new AppError("O campo descricao deve ser um texto", 400);
        }

        if (tipo !== undefined && tipo !== null && typeof tipo !== "string") {
            throw new AppError("O campo tipo deve ser um texto", 400);
        }

        if (typeof tipo === "string" && tipo.trim().length > 50) {
            throw new AppError("O tipo deve ter no máximo 50 caracteres", 400);
        }

        // prazo é obrigatório, precisa ser uma data válida (ex.: "2026-10-30T23:59:00") e estar no futuro
        if (typeof prazo !== "string" || prazo.trim() === "") {
            throw new AppError("O campo prazo é obrigatório", 400);
        }

        const dataEntrega = new Date(prazo);

        if (isNaN(dataEntrega.getTime())) {
            throw new AppError("O campo prazo deve ser uma data válida", 400);
        }

        if (dataEntrega.getTime() <= Date.now()) {
            throw new AppError("O prazo deve ser uma data futura", 400);
        }

        const idTutoria = Number(id_tutoria);
        const idConteudo = Number(id_conteudo);

        // busca a tutoria junto com o vínculo tutor-sala e o aluno que é o tutor
        const tutoria = await prismaClient.tutoria.findUnique({
            where: {
                id_tutoria: idTutoria
            },
            select: {
                id_tutoria: true,
                status: true,
                tutor_sala: {
                    select: {
                        id_tutor_sala: true,
                        id_sala: true,
                        pode_criar_ativ: true,
                        data_revogacao: true,
                        tutor: {
                            select: {
                                id_aluno: true
                            }
                        }
                    }
                }
            }
        });

        // tutoria inexistente, finalizada, vínculo revogado ou o aluno logado não é o tutor dela:
        // tudo responde 403 com a mesma mensagem (não revela se a tutoria existe)
        if (
            !tutoria ||
            tutoria.status !== "ativa" ||
            tutoria.tutor_sala.data_revogacao !== null ||
            tutoria.tutor_sala.tutor.id_aluno !== id_aluno
        ) {
            throw new AppError("Você não é tutor desta tutoria ou ela não está ativa", 403);
        }

        // o professor da sala precisa ter liberado a criação de atividades para o tutor
        if (!tutoria.tutor_sala.pode_criar_ativ) {
            throw new AppError("O professor não liberou a criação de atividades", 403);
        }

        const conteudo = await prismaClient.conteudo.findUnique({
            where: {
                id_conteudo: idConteudo
            },
            select: {
                id_conteudo: true
            }
        });

        if (!conteudo) {
            throw new AppError("Conteúdo não encontrado", 404);
        }

        // o conteúdo precisa estar cadastrado na MESMA sala do Tutor_sala
        // (usa a chave composta gerada pelo @@unique([id_sala, id_conteudo]) de Sala_conteudo)
        const salaConteudo = await prismaClient.sala_conteudo.findUnique({
            where: {
                id_sala_id_conteudo: {
                    id_sala: tutoria.tutor_sala.id_sala,
                    id_conteudo: idConteudo
                }
            },
            select: {
                id_sala_conteudo: true
            }
        });

        if (!salaConteudo) {
            throw new AppError("O conteúdo não pertence à sala desta tutoria", 400);
        }

        // cria a atividade e o destinatário na mesma operação
        // (o Prisma faz isso numa transação, então não sobra atividade sem destinatário)
        const atividade = await prismaClient.atividade.create({
            data: {
                id_tutor_sala: tutoria.tutor_sala.id_tutor_sala,
                id_conteudo: idConteudo,
                titulo: titulo.trim(),
                descricao: typeof descricao === "string" && descricao.trim() !== "" ? descricao.trim() : null,
                tipo: typeof tipo === "string" && tipo.trim() !== "" ? tipo.trim() : null,
                data_entrega: dataEntrega,
                destinatarios: {
                    create: {
                        id_tutoria: idTutoria
                    }
                }
            },
            select: {
                id_atividade: true,
                id_tutor_sala: true,
                id_conteudo: true,
                titulo: true,
                descricao: true,
                tipo: true,
                data_entrega: true,
                destinatarios: {
                    select: {
                        id_att_destinatario: true,
                        id_tutoria: true
                    }
                }
            }
        });

        return atividade;
    }
}

export { CreateAtividadeService };
