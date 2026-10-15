import prismaClient from "../../prisma";

interface ListSalaRequest {
    id_professor: number;
}

class ListSalaService {
    async execute({ id_professor }: ListSalaRequest) {

        // busca somente as salas do professor autenticado
        const salas = await prismaClient.sala.findMany({
            where: {
                id_professor: id_professor
            },
            select: {
                id_sala: true,
                nome: true,
                serie: true,
                ano_letivo: true,
                id_professor: true
            },
            orderBy: {
                id_sala: "asc"
            }
        });

        return salas;
    }
}

export { ListSalaService };
