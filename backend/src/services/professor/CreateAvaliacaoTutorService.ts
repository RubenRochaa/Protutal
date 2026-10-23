import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

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
        if (!Number.isInteger(id_tutor_sala) || id_tutor_sala <= 0) {
            throw new AppError("O id do tutor da sala deve ser um número inteiro", 400);
        }

        // nota é obrigatória e precisa ser número de verdade no JSON (não texto)
        if (typeof nota !== "number" || !Number.isFinite(nota)) {
            throw new AppError("O campo nota é obrigatório e deve ser um número", 400);
        }

        if (nota < 0 || nota > 10) {
            throw new AppError("A nota deve estar entre 0 e 10", 400);
        }

        // a coluna é Decimal(4,2): com mais casas o banco arredondaria sem avisar
        if (Number(nota.toFixed(2)) !== nota) {
            throw new AppError("A nota deve ter no máximo 2 casas decimais", 400);
        }

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
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
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
