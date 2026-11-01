import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface AvisoRequest {
    id_sala: number;
    id_professor: number;
    titulo: string;
    conteudo: string;
}

class CreateAvisoService {
    async execute({ id_sala, id_professor, titulo, conteudo }: AvisoRequest) {

        // o id da sala vem da URL (/salas/:id/avisos) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

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

        // o professor só pode publicar avisos nas próprias salas (RN07)
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // titulo é obrigatório e a coluna aceita no máximo 150 caracteres
        if (typeof titulo !== "string" || titulo.trim() === "") {
            throw new AppError("O campo titulo é obrigatório", 400);
        }

        if (titulo.trim().length > 150) {
            throw new AppError("O título deve ter no máximo 150 caracteres", 400);
        }

        if (typeof conteudo !== "string" || conteudo.trim() === "") {
            throw new AppError("O campo conteudo é obrigatório", 400);
        }

        // RN14: só publica aviso em sala com pelo menos uma tutoria ativa.
        // não filtramos data_revogacao: revogar o tutor já finaliza as tutorias ativas dele
        const tutoriaAtiva = await prismaClient.tutoria.findFirst({
            where: {
                status: "ativa",
                tutor_sala: {
                    id_sala: id_sala
                }
            },
            select: {
                id_tutoria: true
            }
        });

        if (!tutoriaAtiva) {
            throw new AppError("Não é possível publicar o aviso: não há tutoria ativa nesta sala", 409);
        }

        // data_publicacao fica com o default do schema (now()).
        // a notificação aos alunos da sala entra quando existir a tabela de notificação
        const aviso = await prismaClient.aviso.create({
            data: {
                id_sala: id_sala,
                id_professor: id_professor,
                titulo: titulo.trim(),
                conteudo: conteudo.trim()
            },
            select: {
                id_aviso: true,
                titulo: true,
                conteudo: true,
                data_publicacao: true,
                id_sala: true,
                professor: {
                    select: {
                        id_professor: true,
                        nome: true
                    }
                }
            }
        });

        return aviso;
    }
}

export { CreateAvisoService };
