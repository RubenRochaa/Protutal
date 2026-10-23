import prismaClient from "../../prisma";
import { Prisma } from "../../generated/prisma";
import { AppError } from "../../errors/AppError";

interface ConteudoRequest {
    id_sala: number;
    nome: string;
    id_professor: number;
}

class CreateConteudoService {
    async execute({ id_sala, nome, id_professor }: ConteudoRequest) {

        // o id da sala vem da URL (/salas/:id/conteudos) e precisa ser um inteiro positivo
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

        // o professor só pode cadastrar conteúdos nas próprias salas
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // nome é obrigatório e a coluna aceita no máximo 100 caracteres
        if (typeof nome !== "string" || nome.trim() === "") {
            throw new AppError("O campo nome é obrigatório", 400);
        }

        const nomeConteudo = nome.trim();

        if (nomeConteudo.length > 100) {
            throw new AppError("O nome deve ter no máximo 100 caracteres", 400);
        }

        // o nome do conteúdo é único no banco: se outra sala já cadastrou,
        // reaproveitamos o mesmo conteúdo e criamos só o vínculo em sala_conteudo.
        // a busca ignora maiúsculas/minúsculas ("Relevo" e "relevo" são o mesmo conteúdo)
        const conteudoExistente = await prismaClient.conteudo.findFirst({
            where: {
                nome: {
                    equals: nomeConteudo,
                    mode: "insensitive"
                }
            },
            select: {
                id_conteudo: true
            }
        });

        if (conteudoExistente) {
            // usa a chave composta gerada pelo @@unique([id_sala, id_conteudo]) de Sala_conteudo
            const jaCadastradoNaSala = await prismaClient.sala_conteudo.findUnique({
                where: {
                    id_sala_id_conteudo: {
                        id_sala: id_sala,
                        id_conteudo: conteudoExistente.id_conteudo
                    }
                },
                select: {
                    id_sala_conteudo: true
                }
            });

            if (jaCadastradoNaSala) {
                throw new AppError("Conteúdo já cadastrado nesta sala", 409);
            }
        }

        try {
            const salaConteudo = await prismaClient.sala_conteudo.create({
                data: {
                    sala: {
                        connect: { id_sala: id_sala }
                    },
                    // conteúdo novo: cria o conteúdo e o vínculo na mesma operação
                    // (o Prisma faz isso numa transação, então não sobra conteúdo sem sala)
                    conteudo: conteudoExistente
                        ? { connect: { id_conteudo: conteudoExistente.id_conteudo } }
                        : { create: { nome: nomeConteudo } }
                },
                select: {
                    id_sala_conteudo: true,
                    id_sala: true,
                    conteudo: {
                        select: {
                            id_conteudo: true,
                            nome: true
                        }
                    }
                }
            });

            return salaConteudo;
        } catch (err) {
            // P2002 = violação de UNIQUE: duas requisições iguais chegaram ao mesmo tempo
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new AppError("Conteúdo já cadastrado nesta sala", 409);
            }

            throw err;
        }
    }
}

export { CreateConteudoService };
