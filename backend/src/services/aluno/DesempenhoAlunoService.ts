import prismaClient from "../../prisma";
import { AppError } from "../../errors/AppError";
import { parseIdOpcional } from "../../helpers/parseIdOpcional";

interface DesempenhoAlunoRequest {
    id_aluno: number;
    id_sala?: string;
    etapa?: string;
}

// média simples de uma lista de valores, arredondada para 2 casas.
// sem valores a média é null (nunca 0): média só existe onde há nota lançada.
// a soma é feita em centésimos inteiros para não acumular erro de ponto flutuante
function calcularMedia(valores: number[]) {
    if (valores.length === 0) {
        return null;
    }

    const somaCentesimos = valores.reduce((soma, valor) => soma + Math.round(valor * 100), 0);

    return Math.round(somaCentesimos / valores.length) / 100;
}

// dashboard de notas do aluno logado (RF26): média geral, por etapa, por conteúdo e a lista das notas
class DesempenhoAlunoService {
    async execute({ id_aluno, id_sala, etapa }: DesempenhoAlunoRequest) {

        // filtros opcionais da query string: se vierem, precisam ser válidos (400)
        let etapaFiltro: number | undefined;

        if (etapa !== undefined) {
            etapaFiltro = Number(etapa);

            if (![1, 2, 3].includes(etapaFiltro)) {
                throw new AppError("A etapa deve ser 1, 2 ou 3", 400);
            }
        }

        const idSalaFiltro = parseIdOpcional(id_sala, "O id da sala deve ser um número inteiro");

        // notas do aluno logado (Nota.id_aluno), com a sala vindo de Atividade -> Tutor_sala.
        // não filtra pelo status da tutoria: o histórico continua disponível
        // depois que a tutoria é finalizada (RN14);
        // a consulta parte de Nota, então atividade sem nota lançada não entra em nenhum cálculo;
        // uma única consulta: atividade, conteúdo e contestação vêm juntos pelo select (sem N+1);
        // filtros ausentes ficam undefined e o Prisma ignora o campo
        const notas = await prismaClient.nota.findMany({
            where: {
                id_aluno: id_aluno,
                atividade: {
                    etapa: etapaFiltro,
                    tutor_sala: {
                        id_sala: idSalaFiltro
                    }
                }
            },
            // etapa -> data de lançamento; id_nota só desempata
            orderBy: [
                { atividade: { etapa: "asc" } },
                { data_lancamento: "asc" },
                { id_nota: "asc" }
            ],
            select: {
                id_nota: true,
                valor: true,
                comentario: true,
                data_lancamento: true,
                atividade: {
                    select: {
                        id_atividade: true,
                        titulo: true,
                        tipo: true,
                        etapa: true,
                        conteudo: {
                            select: {
                                id_conteudo: true,
                                nome: true
                            }
                        }
                    }
                },
                // hoje só existe uma contestação por nota (409 no CreateContestacaoNotaService);
                // o take: 1 pela mais recente é só garantia
                contestacoes: {
                    select: {
                        status: true
                    },
                    orderBy: {
                        data_envio: "desc"
                    },
                    take: 1
                }
            }
        });

        // valor é Decimal no Prisma (viria como texto no JSON), então convertemos para número
        const valores = notas.map((nota) => Number(nota.valor));

        // sem filtro aparecem sempre as 3 etapas; com ?etapa= só a etapa filtrada.
        // etapa sem nota aparece com media null e quantidade 0
        const etapas = etapaFiltro === undefined ? [1, 2, 3] : [etapaFiltro];

        const por_etapa = etapas.map((numeroEtapa) => {
            const valoresEtapa = notas
                .filter((nota) => nota.atividade.etapa === numeroEtapa)
                .map((nota) => Number(nota.valor));

            return {
                etapa: numeroEtapa,
                media: calcularMedia(valoresEtapa),
                quantidade: valoresEtapa.length
            };
        });

        // agrupa por conteúdo a partir das próprias notas,
        // então conteúdo sem nenhuma nota nunca aparece (e nunca aparece com média 0)
        const conteudos = new Map<number, { nome: string; valores: number[] }>();

        for (const nota of notas) {
            const { id_conteudo, nome } = nota.atividade.conteudo;
            const grupo = conteudos.get(id_conteudo) ?? { nome, valores: [] };

            grupo.valores.push(Number(nota.valor));
            conteudos.set(id_conteudo, grupo);
        }

        const por_conteudo = Array.from(conteudos, ([id_conteudo, grupo]) => ({
            id_conteudo,
            nome: grupo.nome,
            media: calcularMedia(grupo.valores),
            quantidade: grupo.valores.length
        })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

        // sem nenhuma nota: media null, total 0, etapas null/0 e listas vazias (não é erro)
        return {
            media_geral: {
                media: calcularMedia(valores),
                total_notas: valores.length
            },
            por_etapa,
            por_conteudo,
            // achata atividade.conteudo para conteudo e a contestação para só o status (ou null)
            notas: notas.map((nota) => ({
                id_nota: nota.id_nota,
                valor: Number(nota.valor),
                comentario: nota.comentario,
                data_lancamento: nota.data_lancamento,
                atividade: {
                    id_atividade: nota.atividade.id_atividade,
                    titulo: nota.atividade.titulo,
                    tipo: nota.atividade.tipo,
                    etapa: nota.atividade.etapa
                },
                conteudo: {
                    nome: nota.atividade.conteudo.nome
                },
                contestacao_status: nota.contestacoes[0]?.status ?? null
            }))
        };
    }
}

export { DesempenhoAlunoService };
