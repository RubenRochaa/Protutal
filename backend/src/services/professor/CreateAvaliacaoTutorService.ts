import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { validarFaixaNota } from "../../helpers/validarNota";
import { MENSAGEM_SEM_PERMISSAO_SALA } from "../../helpers/buscarSalaDoProfessor";
import { validarId } from "../../helpers/validarId";

interface AvaliacaoTutorRequest {
    id_tutor_sala: number;
    id_professor: number;
    nota: number;
    comentario: string;
}

class CreateAvaliacaoTutorService {
    async execute({ id_tutor_sala, id_professor, nota, comentario }: AvaliacaoTutorRequest) {

        // 1) validação do id da URL e do corpo (400), antes de qualquer consulta ao banco

        // o id do vínculo vem da URL (/tutores-sala/:id/avaliacoes) e precisa ser um inteiro positivo
        validarId(id_tutor_sala, "O id do tutor da sala deve ser um número inteiro");

        // nota é obrigatória e precisa ser número de verdade no JSON (não texto)
        if (typeof nota !== "number" || !Number.isFinite(nota)) {
            throw new AppError("O campo nota é obrigatório e deve ser um número", 400);
        }

        validarFaixaNota(nota, "A nota");

        // comentario é obrigatório no schema: não aceita vazio nem só espaços
        if (typeof comentario !== "string" || comentario.trim() === "") {
            throw new AppError("O campo comentario é obrigatório e não pode ser vazio", 400);
        }

        // 2) o vínculo existe (404); a sala dele diz quem é o professor dono
        const tutorSala = await prismaClient.tutor_sala.findUnique({
            where: {
                id_tutor_sala: id_tutor_sala
            },
            select: {
                id_tutor_sala: true,
                sala: {
                    select: {
                        id_professor: true
                    }
                }
            }
        });

        if (!tutorSala) {
            throw new AppError("Tutor da sala não encontrado", 404);
        }

        // 3) mesmo critério da revogação (P8): só o professor dono da sala (403).
        // tutor revogado também pode ser avaliado, e o mesmo tutor pode ter várias avaliações
        if (tutorSala.sala.id_professor !== id_professor) {
            throw new AppError(MENSAGEM_SEM_PERMISSAO_SALA, 403);
        }

        // data fica com o default do banco (now())
        const avaliacao = await prismaClient.avaliacao_tutor.create({
            data: {
                id_tutor_sala: tutorSala.id_tutor_sala,
                id_professor: id_professor,
                nota: nota,
                comentario: comentario.trim()
            },
            select: {
                id_avaliacao: true,
                id_tutor_sala: true,
                id_professor: true,
                nota: true,
                comentario: true,
                data: true
            }
        });

        // nota é Decimal no Prisma e iria para o JSON como texto ("8.5"); convertemos para número
        return { ...avaliacao, nota: Number(avaliacao.nota) };
    }
}

export { CreateAvaliacaoTutorService };
