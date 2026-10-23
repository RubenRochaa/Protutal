import prismaClient from "../../prisma";

interface ListAlunoRequest {
    busca?: string;
}

class ListAlunoService {
    async execute({ busca }: ListAlunoRequest) {

        const termo = typeof busca === "string" ? busca.trim() : "";

        // sem termo de busca, lista todos os alunos;
        // com termo, filtra por nome OU email (busca parcial, sem diferenciar maiúsculas e minúsculas)
        const filtro = termo === ""
            ? {}
            : {
                OR: [
                    { nome: { contains: termo, mode: "insensitive" as const } },
                    { email: { contains: termo, mode: "insensitive" as const } }
                ]
            };

        // select explícito: senha (hash) e tokens de confirmação nunca saem na resposta
        const alunos = await prismaClient.aluno.findMany({
            where: filtro,
            select: {
                id_aluno: true,
                nome: true,
                email: true,
                email_confirmado: true
            },
            orderBy: {
                nome: "asc"
            }
        });

        return alunos;
    }
}

export { ListAlunoService };
