import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { parseIdOpcional } from "../../helpers/parseIdOpcional";
import { selectAtividadeResumo, camposAtividadeResumo, contagensAtividade } from "../../helpers/atividadeResumo";

interface ListAtividadesSalaRequest {
    id_sala: number;
    id_professor: number;
    etapa?: string;
    id_conteudo?: string;
    id_tutor_sala?: string;
}

class ListAtividadesSalaService {
    async execute({ id_sala, id_professor, etapa, id_conteudo, id_tutor_sala }: ListAtividadesSalaRequest) {

        // o id da sala vem da URL (/salas/:id/atividades) e precisa ser um inteiro positivo
        if (!Number.isInteger(id_sala) || id_sala <= 0) {
            throw new AppError("O id da sala deve ser um número inteiro", 400);
        }

        // filtros opcionais da query string: se vierem, precisam ser válidos
        // (conferidos antes de buscar a sala, para o 400 vir antes do 404 e do 403)
        let etapaFiltro: number | undefined;

        if (etapa !== undefined) {
            etapaFiltro = Number(etapa);

            if (![1, 2, 3].includes(etapaFiltro)) {
                throw new AppError("A etapa deve ser 1, 2 ou 3", 400);
            }
        }

        const idConteudoFiltro = parseIdOpcional(id_conteudo, "O id do conteúdo deve ser um número inteiro");
        const idTutorSalaFiltro = parseIdOpcional(id_tutor_sala, "O id do tutor da sala deve ser um número inteiro");

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

        // o professor só pode ver as atividades das próprias salas (RN07)
        if (sala.id_professor !== id_professor) {
            throw new AppError("Você não tem permissão para acessar esta sala", 403);
        }

        // atividades cujo vínculo Tutor_sala é desta sala (Atividade -> Tutor_sala -> Sala);
        // filtros ausentes ficam undefined e o Prisma ignora o campo.
        // os campos comuns e as contagens (_count, sem N+1) vêm do helper atividadeResumo;
        // se não houver atividades (ou o filtro não achar nada), volta lista vazia e isso não é erro
        const atividades = await prismaClient.atividade.findMany({
            where: {
                tutor_sala: {
                    id_sala: id_sala
                },
                etapa: etapaFiltro,
                id_conteudo: idConteudoFiltro,
                id_tutor_sala: idTutorSalaFiltro
            },
            orderBy: {
                data_entrega: "desc"
            },
            select: {
                ...selectAtividadeResumo,
                tutor_sala: {
                    select: {
                        id_tutor_sala: true,
                        tutor: {
                            select: {
                                aluno: {
                                    select: {
                                        nome: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // achata tutor_sala.tutor.aluno e _count, deixando a resposta mais simples para o front
        return atividades.map((atividade) => ({
            ...camposAtividadeResumo(atividade),
            tutor: {
                id_tutor_sala: atividade.tutor_sala.id_tutor_sala,
                nome: atividade.tutor_sala.tutor.aluno.nome
            },
            ...contagensAtividade(atividade)
        }));
    }
}

export { ListAtividadesSalaService };
