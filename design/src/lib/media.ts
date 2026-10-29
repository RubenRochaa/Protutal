// Cópia da regra do back-end (backend/src/helpers/calcularMedia.ts), usada no desempenho (A6):
// média simples, arredondada para 2 casas; sem valores a média é null (nunca 0).
// A soma é feita em centésimos inteiros para não acumular erro de ponto flutuante.
// O front usa esta função para montar as médias dos alunos a partir das notas da P14 (decisão D5).
export function calcularMedia(valores: number[]): number | null {
    if(valores.length === 0) return null

    const somaCentesimos = valores.reduce((soma, valor) => soma + Math.round(valor * 100), 0)

    return Math.round(somaCentesimos / valores.length) / 100
}
