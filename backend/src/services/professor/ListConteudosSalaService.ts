import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { validarId } from "../../helpers/validarId";

interface ListConteudosSalaRequest {
    id_sala: number;
}

class ListConteudosSalaService {
    async execute({ id_sala }: ListConteudosSalaRequest) {

        // a permissão (professor dono ou tutor ativo) e a existência da sala
        // já foram conferidas no middleware isTutorAtivoSala;
        // a validação do id fica aqui também para o service não depender da rota
        validarId(id_sala, "O id da sala deve ser um número inteiro");

        // conteúdos que têm vínculo com esta sala na tabela sala_conteudo
        const conteudos = await prismaClient.conteudo.findMany({
            where: {
                salas: {
                    some: {
                        id_sala: id_sala
                    }
                }
            },
            select: {
                id_conteudo: true,
                nome: true
            },
            orderBy: {
                nome: "asc"
            }
        });

        return conteudos;
    }
}

export { ListConteudosSalaService };
