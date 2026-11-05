// "Última visita" dos contadores de notificação (bolinha vermelha), guardada no localStorage.
// Cada tela grava a data/hora em que foi aberta; o contador conta os itens com data posterior.
// Só funciona no navegador: as funções que usam o localStorage são chamadas nos componentes cliente

// Área do site: quem é tutor tem contadores separados na área do aluno e na do tutor
export type AreaContador = "professor" | "aluno" | "tutor"

// O que foi visitado: "notas", "chat:<id_tutoria>" ou "avisos:<id_sala>"
export type SufixoVisita = "notas" | `chat:${string}` | `avisos:${string}`

const PREFIXO = "protutal:visita"

// A chave tem a área e o id do usuário para não misturar contas no mesmo navegador.
// Ex.: "protutal:visita:aluno:12:chat:5"
export function chaveVisita(area: AreaContador, idUsuario: string, sufixo: SufixoVisita){
    return `${PREFIXO}:${area}:${idUsuario}:${sufixo}`
}

// Data da última visita em milissegundos, ou null se ainda não tem nada salvo
export function lerVisita(chave: string){
    try {
        const valor = localStorage.getItem(chave)
        const data = valor ? Date.parse(valor) : NaN

        return Number.isNaN(data) ? null : data
    } catch {
        // Navegador sem localStorage (ex.: bloqueado): o contador fica zerado
        return null
    }
}

// Grava "agora" como a última visita (a tela foi aberta)
export function gravarVisita(chave: string){
    try {
        localStorage.setItem(chave, new Date().toISOString())
    } catch {
        // Sem localStorage não tem como guardar: segue sem contador
    }
}

// Primeira vez (sem data salva): considera tudo como já visto,
// para não acender a bolinha com o histórico inteiro
export function iniciarVisita(chave: string){
    if(lerVisita(chave) === null) gravarVisita(chave)
}

// Quantas datas (ISO, como a API devolve) são posteriores à última visita
export function contarDepois(datas: string[], desde: number | null){
    if(desde === null) return 0

    return datas.filter((data) => Date.parse(data) > desde).length
}
