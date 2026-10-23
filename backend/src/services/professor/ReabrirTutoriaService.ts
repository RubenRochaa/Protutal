import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface ReabrirTutoriaRequest {
    id_tutoria: number;
    id_professor: number;
}

const MENSAGEM_JA_ATIVA = "Esta tutoria já está ativa";

class ReabrirTutoriaService {
    async execute({ id_tutoria, id_professor }: ReabrirTutoriaRequest) {

        // o id da tutoria vem da URL (/tutorias/:id/reabrir) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_tutoria) || id_tutoria <= 0) {
            throw new AppError("O id da tutoria deve ser um número inteiro", 400);
        }

        // a sala da tutoria é descoberta pelo caminho Tutoria -> Tutor_sala -> Sala;
        // data_revogacao diz se o tutor ainda está ativo e ano_letivo limita a reabertura ao ano atual
        const tutoria = await prismaClient.tutoria.findUnique({
            where: {
                id_tutoria: id_tutoria
            },
            select: {
                id_tutoria: true,
                status: true,
                id_aluno: true,
                tutor_sala: {
                    select: {
                        id_sala: true,
                        data_revogacao: true,
                        sala: {
                            select: {
                                id_professor: true,
                                ano_letivo: true
                            }
                        }
                    }
                }
            }
        });

        if (!tutoria) {
            throw new AppError("Tutoria não encontrada", 404);
        }

        // mesmo critério da finalização: só o professor dono da sala
        if (tutoria.tutor_sala.sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        if (tutoria.status !== "finalizada") {
            throw new AppError(MENSAGEM_JA_ATIVA, 409);
        }

        // só é possível reabrir no mesmo ano letivo da sala
        const anoLetivo = tutoria.tutor_sala.sala.ano_letivo;

        if (anoLetivo !== new Date().getFullYear()) {
            throw new AppError(`Não é possível reabrir a tutoria: ela é de outro ano letivo (${anoLetivo})`, 409);
        }

        // tutor revogado: o histórico não passa ao novo tutor, então a tutoria não volta a ficar ativa
        if (tutoria.tutor_sala.data_revogacao !== null) {
            throw new AppError("Não é possível reabrir a tutoria: o tutor foi revogado", 409);
        }

        // o aluno tutorado não pode ficar com duas tutorias ativas na mesma sala
        const outraAtiva = await prismaClient.tutoria.findFirst({
            where: {
                id_aluno: tutoria.id_aluno,
                status: "ativa",
                id_tutoria: {
                    not: tutoria.id_tutoria
                },
                tutor_sala: {
                    id_sala: tutoria.tutor_sala.id_sala
                }
            },
            select: {
                id_tutoria: true
            }
        });

        if (outraAtiva) {
            throw new AppError("Não é possível reabrir a tutoria: o aluno já tem outra tutoria ativa nesta sala", 409);
        }

        // o filtro status: "finalizada" evita reabrir duas vezes se outra requisição
        // reabrir a tutoria entre a leitura acima e este update;
        // data_fim volta a null porque a finalização a preencheu
        const atualizadas = await prismaClient.tutoria.updateMany({
            where: {
                id_tutoria: tutoria.id_tutoria,
                status: "finalizada"
            },
            data: {
                status: "ativa",
                data_fim: null
            }
        });

        if (atualizadas.count === 0) {
            throw new AppError(MENSAGEM_JA_ATIVA, 409);
        }

        const tutoriaAtualizada = await prismaClient.tutoria.findUnique({
            where: {
                id_tutoria: tutoria.id_tutoria
            },
            select: {
                id_tutoria: true,
                status: true,
                data_fim: true
            }
        });

        return tutoriaAtualizada;
    }
}

export { ReabrirTutoriaService };
