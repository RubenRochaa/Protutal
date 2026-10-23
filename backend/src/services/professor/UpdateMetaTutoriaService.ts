import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface UpdateMetaTutoriaRequest {
    id_tutoria: number;
    id_professor: number;
    meta_aprendizagem: string;
}

const MENSAGEM_FINALIZADA = "Esta tutoria está finalizada. É preciso reabrir a tutoria antes de alterar a meta";

class UpdateMetaTutoriaService {
    async execute({ id_tutoria, id_professor, meta_aprendizagem }: UpdateMetaTutoriaRequest) {

        // o id da tutoria vem da URL (/tutorias/:id/meta) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_tutoria) || id_tutoria <= 0) {
            throw new AppError("O id da tutoria deve ser um número inteiro", 400);
        }

        // a sala da tutoria é descoberta pelo caminho Tutoria -> Tutor_sala -> Sala
        const tutoria = await prismaClient.tutoria.findUnique({
            where: {
                id_tutoria: id_tutoria
            },
            select: {
                id_tutoria: true,
                status: true,
                tutor_sala: {
                    select: {
                        sala: {
                            select: {
                                id_professor: true
                            }
                        }
                    }
                }
            }
        });

        if (!tutoria) {
            throw new AppError("Tutoria não encontrada", 404);
        }

        // mesmo critério da listagem de tutorias da sala: só o professor dono da sala
        if (tutoria.tutor_sala.sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // meta é obrigatória; a coluna é TEXT, então não há tamanho máximo no schema
        if (typeof meta_aprendizagem !== "string" || meta_aprendizagem.trim() === "") {
            throw new AppError("O campo meta_aprendizagem é obrigatório", 400);
        }

        const meta = meta_aprendizagem.trim();

        // tutoria finalizada não pode ter a meta alterada
        if (tutoria.status !== "ativa") {
            throw new AppError(MENSAGEM_FINALIZADA, 409);
        }

        // o filtro status: "ativa" evita gravar a meta se a tutoria for finalizada
        // entre a leitura acima e este update; se já existir meta, ela é substituída
        const atualizadas = await prismaClient.tutoria.updateMany({
            where: {
                id_tutoria: tutoria.id_tutoria,
                status: "ativa"
            },
            data: {
                meta_aprendizagem: meta
            }
        });

        if (atualizadas.count === 0) {
            throw new AppError(MENSAGEM_FINALIZADA, 409);
        }

        const tutoriaAtualizada = await prismaClient.tutoria.findUnique({
            where: {
                id_tutoria: tutoria.id_tutoria
            },
            select: {
                id_tutoria: true,
                status: true,
                meta_aprendizagem: true
            }
        });

        return tutoriaAtualizada;
    }
}

export { UpdateMetaTutoriaService };
