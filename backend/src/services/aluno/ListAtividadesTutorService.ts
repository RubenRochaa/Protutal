import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { parseIdOpcional } from "../../helpers/parseIdOpcional";
import { selectAtividadeResumo, camposAtividadeResumo, contagensAtividade } from "../../helpers/atividadeResumo";

interface ListAtividadesTutorRequest {
    id_aluno: number;
    email: string;
    id_sala?: string;
    id_conteudo?: string;
    etapa?: string;
}

// atividades criadas pelo tutor logado, no mesmo formato da P11 (GET /salas/:id/atividades),
// trocando o bloco "tutor" pelo bloco "sala"
class ListAtividadesTutorService {
    async execute({ id_aluno, email, id_sala, id_conteudo, etapa }: ListAtividadesTutorRequest) {

        // filtros opcionais da query string: se vierem, precisam ser válidos (400)
        let etapaFiltro: number | undefined;

        if (etapa !== undefined) {
            etapaFiltro = Number(etapa);

            if (![1, 2, 3].includes(etapaFiltro)) {
                throw new AppError("A etapa deve ser 1, 2 ou 3", 400);
            }
        }

        const idSalaFiltro = parseIdOpcional(id_sala, "O id da sala deve ser um número inteiro");
        const idConteudoFiltro = parseIdOpcional(id_conteudo, "O id do conteúdo deve ser um número inteiro");

        // sem email no token não dá para conferir (e o Prisma ignoraria o filtro email: undefined)
        if (!email) {
            throw new AppError("Acesso permitido somente para tutores com vínculo ativo", 403);
        }

        // atividades criadas pelos vínculos Tutor_sala do tutor logado que estão ativos
        // (sem data_revogacao; vínculo revogado não entra, mesma regra da A2 e da P12).
        // ?id_sala= de uma sala que não é dele volta lista vazia; filtros ausentes ficam
        // undefined e o Prisma ignora o campo. sala e conteúdo vêm por join e as contagens
        // pelo _count, tudo na mesma consulta (sem N+1); sem atividades, volta [] (não é erro)
        const atividades = await prismaClient.atividade.findMany({
            where: {
                etapa: etapaFiltro,
                id_conteudo: idConteudoFiltro,
                tutor_sala: {
                    data_revogacao: null,
                    id_sala: idSalaFiltro,
                    tutor: {
                        aluno: {
                            id_aluno: id_aluno,
                            email: email
                        }
                    }
                }
            },
            orderBy: {
                data_entrega: "desc"
            },
            select: {
                ...selectAtividadeResumo,
                tutor_sala: {
                    select: {
                        sala: {
                            select: {
                                id_sala: true,
                                nome: true
                            }
                        }
                    }
                }
            }
        });

        // achata tutor_sala.sala e _count, deixando a resposta mais simples para o front
        return atividades.map((atividade) => ({
            ...camposAtividadeResumo(atividade),
            sala: atividade.tutor_sala.sala,
            ...contagensAtividade(atividade)
        }));
    }
}

export { ListAtividadesTutorService };
