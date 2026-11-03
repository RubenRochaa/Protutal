// Datas sempre no fuso de São Paulo: a API devolve em UTC
// (ex.: 2026-11-11T02:59Z = 10/11/2026 às 23h59)
const formatoData = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" })

const formatoHora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit"
})

// Nota com vírgula e até 2 casas, como a API aceita (ex.: 8.5 = "8,5"; 10 = "10")
const formatoNota = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })

// "10/11/2026"
export function formatarData(iso: string): string {
    return formatoData.format(new Date(iso))
}

// "10/11/2026 às 23:59"
export function formatarDataHora(iso: string): string {
    const data = new Date(iso)

    return `${formatoData.format(data)} às ${formatoHora.format(data)}`
}

export function formatarNota(valor: number): string {
    return formatoNota.format(valor)
}

// Primeira letra do primeiro e do último nome (ex.: "Ruben Rocha" -> "RR")
export function iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/).filter(Boolean)
    if(partes.length === 0) return ""

    const primeira = partes[0][0]
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ""

    return (primeira + ultima).toUpperCase()
}

// Média que pode não existir (null = sem nota). Nunca mostra 0 no lugar de "sem nota"
export function formatarMedia(valor: number | null, semValor = "Sem nota"): string {
    return valor === null ? semValor : formatarNota(valor)
}

// Rótulo legível do tipo de atividade. Os rótulos vêm da T8 (GET /tipos-atividade);
// se a T8 falhar, troca "_" por espaço (ex.: interpretacao_mapas -> "Interpretacao mapas")
export function rotuloTipo(tipo: string, tipos: { valor: string; rotulo: string }[]): string {
    const encontrado = tipos.find((t) => t.valor === tipo)
    if(encontrado) return encontrado.rotulo

    const texto = tipo.replaceAll("_", " ")

    return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Ano usado para separar salas atuais e anteriores. Mesma regra da P7 (reabrir tutoria),
// que compara o ano_letivo da sala com o ano do relógio do servidor
export function anoAtual(): number {
    return new Date().getFullYear()
}
