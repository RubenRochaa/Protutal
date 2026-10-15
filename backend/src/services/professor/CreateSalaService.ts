import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";

interface SalaRequest {
    nome: string;
    serie: number;
    ano_letivo: number;
    id_professor: number;
}

class CreateSalaService {
    async execute({ nome, serie, ano_letivo, id_professor }: SalaRequest) {

        // nome é obrigatório e a coluna aceita no máximo 100 caracteres
        if (typeof nome !== "string" || nome.trim() === "") {
            throw new AppError("O campo nome é obrigatório", 400);
        }

        if (nome.trim().length > 100) {
            throw new AppError("O nome deve ter no máximo 100 caracteres", 400);
        }

        // serie é obrigatória e só pode ser 1, 2 ou 3 (anos do Ensino Médio)
        if (serie === undefined || serie === null) {
            throw new AppError("O campo serie é obrigatório", 400);
        }

        if (![1, 2, 3].includes(Number(serie))) {
            throw new AppError("A serie deve ser 1, 2 ou 3", 400);
        }

        // ano_letivo é obrigatório e precisa ser um número inteiro
        if (ano_letivo === undefined || ano_letivo === null || String(ano_letivo).trim() === "") {
            throw new AppError("O campo ano_letivo é obrigatório", 400);
        }

        if (!Number.isInteger(Number(ano_letivo))) {
            throw new AppError("O ano_letivo deve ser um número inteiro", 400);
        }

        const sala = await prismaClient.sala.create({
            data: {
                nome: nome.trim(),
                serie: Number(serie),
                ano_letivo: Number(ano_letivo),
                id_professor: id_professor
            },
            select: {
                id_sala: true,
                nome: true,
                serie: true,
                ano_letivo: true,
                id_professor: true
            }
        });

        return sala;
    }
}

export { CreateSalaService };
