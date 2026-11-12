// Cópia de design/src/lib/media.ts (regra do back-end em backend/src/helpers/calcularMedia.ts):
// média simples, arredondada para 2 casas; sem valores a média é null (nunca 0).
// A soma é feita em centésimos inteiros para não acumular erro de ponto flutuante.
// Usada no desempenho dos tutorados do professor, montado a partir das notas da P14
export function calcularMedia(valores: number[]): number | null {
    if(valores.length === 0) return null

    const somaCentesimos = valores.reduce((soma, valor) => soma + Math.round(valor * 100), 0)

    return Math.round(somaCentesimos / valores.length) / 100
}
