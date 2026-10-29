import prismaClient from "../prisma";
import { AppError } from "../errors/AppError";

// papel do aluno logado dentro da tutoria
type PapelTutoria = "tutor" | "tutorado";

// usada pelas rotas de mensagem (enviar e listar) e de feedback: confere, nesta ordem,
// id inválido (400) -> tutoria não encontrada (404) -> aluno não participa (403)
// e devolve a tutoria junto com o papel do aluno nela
async function buscarParticipanteTutoria(id_tutoria: number, id_aluno: number) {

    // o id da tutoria vem da URL (/tutorias/:id/mensagens) e precisa ser um inteiro positivo
    if (!Number.isInteger(id_tutoria) || id_tutoria <= 0) {
        throw new AppError("O id da tutoria deve ser um número inteiro", 400);
    }

    // o tutor é descoberto pelo caminho Tutoria -> Tutor_sala -> Tutor -> Aluno.
    // data_revogacao vem junto para quem precisar conferir se o vínculo do tutor está ativo
    const tutoria = await prismaClient.tutoria.findUnique({
        where: {
            id_tutoria: id_tutoria
        },
        select: {
            id_tutoria: true,
            id_aluno: true,
            status: true,
            tutor_sala: {
                select: {
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

    if (!tutoria) {
        throw new AppError("Tutoria não encontrada", 404);
    }

    // só os dois participantes da tutoria: o aluno tutorado (Tutoria.id_aluno)
    // ou o aluno que é o tutor (Tutor.id_aluno). o isAluno da rota já garantiu
    // que o id do token é de um aluno
    let papel: PapelTutoria;

    if (tutoria.id_aluno === id_aluno) {
        papel = "tutorado";
    } else if (tutoria.tutor_sala.tutor.id_aluno === id_aluno) {
        papel = "tutor";
    } else {
        throw new AppError("Você não participa desta tutoria", 403);
    }

    return { tutoria, papel };
}

export { buscarParticipanteTutoria };
export type { PapelTutoria };
