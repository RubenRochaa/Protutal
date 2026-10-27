import prismaClient from "../../prisma";
import { parseIdOpcional } from "../../helpers/parseIdOpcional";
import { calcularMedia } from "../../helpers/calcularMedia";

interface ConteudosDominadosRequest {
    id_aluno: number;
    id_sala?: string;
}

interface ConteudoClassificado {
    id_conteudo: number;
    nome: string;
    media: number;
    quantidade: number;
}

// sem faixa cadastrada não dá para classificar: é falha de configuração, não do usuário.
// Error comum (não AppError) cai no handler global: console.error com esta mensagem e resposta 500
const ERRO_FAIXAS = "faixas de desempenho não cadastradas";

// conteúdos dominados e com dificuldade do aluno logado (RF27),
// classificados pela média de cada conteúdo segundo a tabela faixa_desempenho
class ConteudosDominadosService {
    async execute({ id_aluno, id_sala }: ConteudosDominadosRequest) {

        // filtro opcional da query string: se vier, precisa ser um inteiro positivo (400)
        const idSalaFiltro = parseIdOpcional(id_sala, "O id da sala deve ser um número inteiro");

        // notas do aluno logado (Nota.id_aluno), com a sala vindo de Atividade -> Tutor_sala.
        // não filtra pelo status da tutoria: o histórico continua disponível (RN14);
        // a consulta parte de Nota, então conteúdo sem atividade ou com atividade
        // ainda sem nota nunca aparece (não existe média 0 inventada)
        const notas = await prismaClient.nota.findMany({
            where: {
                id_aluno: id_aluno,
                atividade: {
                    tutor_sala: {
                        id_sala: idSalaFiltro
                    }
                }
            },
            select: {
                valor: true,
                atividade: {
                    select: {
                        conteudo: {
                            select: {
                                id_conteudo: true,
                                nome: true
                            }
                        }
                    }
                }
            }
        });

        // as faixas são lidas da tabela: nenhum limite (7, 6.99...) fica escrito no código
        const faixas = await prismaClient.faixa_desempenho.findMany({
            orderBy: {
                nota_min: "asc"
            }
        });

        if (faixas.length === 0) {
            throw new Error(ERRO_FAIXAS);
        }

        // agrupa por conteúdo a partir das próprias notas
        const conteudos = new Map<number, { nome: string; valores: number[] }>();

        for (const nota of notas) {
            const { id_conteudo, nome } = nota.atividade.conteudo;
            const grupo = conteudos.get(id_conteudo) ?? { nome, valores: [] };

            // valor é Decimal no Prisma, então convertemos para número
            grupo.valores.push(Number(nota.valor));
            conteudos.set(id_conteudo, grupo);
        }

        // uma lista por faixa cadastrada, com o nome da faixa como chave:
        // se a tabela ganhar outra faixa, ela aparece aqui sem mudar o código
        const resultado: Record<string, ConteudoClassificado[]> = {};

        for (const faixa of faixas) {
            resultado[faixa.nome] = [];
        }

        for (const [id_conteudo, grupo] of conteudos) {
            // a média já vem arredondada para 2 casas ANTES de classificar (6,995 vira 7,00);
            // o grupo sempre tem ao menos uma nota, então a média nunca é null aqui
            const media = calcularMedia(grupo.valores) as number;

            // comparação em centésimos inteiros para não errar por ponto flutuante
            const mediaCentesimos = Math.round(media * 100);

            const faixa = faixas.find((f) =>
                Math.round(Number(f.nota_min) * 100) <= mediaCentesimos &&
                mediaCentesimos <= Math.round(Number(f.nota_max) * 100)
            );

            // média fora de todas as faixas: a tabela está incompleta, não inventamos classificação
            if (!faixa) {
                throw new Error(ERRO_FAIXAS);
            }

            resultado[faixa.nome].push({
                id_conteudo,
                nome: grupo.nome,
                media,
                quantidade: grupo.valores.length
            });
        }

        // cada lista em ordem alfabética do nome do conteúdo
        for (const lista of Object.values(resultado)) {
            lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        }

        // sem nenhuma nota: todas as listas vazias (não é erro)
        return resultado;
    }
}

export { ConteudosDominadosService };
