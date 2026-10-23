import { TipoAtividade } from "../generated/prisma";

// rótulo em português de cada tipo de atividade, para exibir no front-end.
// Record<TipoAtividade, string>: se o enum do schema ganhar ou perder um valor,
// o TypeScript acusa erro aqui em vez de a lista ficar incompleta
const ROTULOS_TIPO_ATIVIDADE: Record<TipoAtividade, string> = {
    aula_invertida: "Aula invertida",
    prova_alternativa: "Prova de alternativas",
    prova_dissertativa: "Prova dissertativa",
    projeto: "Projeto",
    interpretacao_imagens: "Interpretação de imagens",
    exercicios_livro: "Exercícios do livro",
    interpretacao_mapas: "Interpretação de mapas",
    analise_graficos: "Análise de gráficos",
    mapa_mental: "Mapa mental",
    pesquisa: "Pesquisa",
    estudo_caso: "Estudo de caso",
    trabalho_campo: "Trabalho de campo",
    teatro: "Teatro",
    atividade_extracurricular: "Atividade extracurricular",
    autoavaliacao: "Autoavaliação"
};

export { ROTULOS_TIPO_ATIVIDADE };
