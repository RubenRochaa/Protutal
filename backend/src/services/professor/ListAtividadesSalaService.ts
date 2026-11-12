import prismaClient from "../../prisma";
import { parseEtapaOpcional } from "../../helpers/validarEtapa";
import { buscarSalaDoProfessor } from "../../helpers/buscarSalaDoProfessor";
import { validarId } from "../../helpers/validarId";
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
        validarId(id_sala, "O id da sala deve ser um número inteiro");

        // filtros opcionais da query string: se vierem, precisam ser válidos
        // (conferidos antes de buscar a sala, para o 400 vir antes do 404 e do 403)
        const etapaFiltro = parseEtapaOpcional(etapa);

        const idConteudoFiltro = parseIdOpcional(id_conteudo, "O id do conteúdo deve ser um número inteiro");
        const idTutorSalaFiltro = parseIdOpcional(id_tutor_sala, "O id do tutor da sala deve ser um número inteiro");

        // o professor só pode ver as atividades das próprias salas (RN07)
        await buscarSalaDoProfessor(id_sala, id_professor);

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
