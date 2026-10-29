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
