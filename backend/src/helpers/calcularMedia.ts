// média simples de uma lista de valores, arredondada para 2 casas.
// sem valores a média é null (nunca 0): média só existe onde há nota lançada.
// a soma é feita em centésimos inteiros para não acumular erro de ponto flutuante.
// usado no dashboard de desempenho (A6) e nos conteúdos dominados (A7)
function calcularMedia(valores: number[]) {
    if (valores.length === 0) {
        return null;
    }

    const somaCentesimos = valores.reduce((soma, valor) => soma + Math.round(valor * 100), 0);

    return Math.round(somaCentesimos / valores.length) / 100;
}

export { calcularMedia };
