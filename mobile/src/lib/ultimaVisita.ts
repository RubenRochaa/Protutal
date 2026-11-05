import AsyncStorage from "@react-native-async-storage/async-storage";

// "Última visita" dos contadores de notificação (bolinha vermelha), guardada no AsyncStorage.
// Mesma regra do site (design/src/lib/ultimaVisita.ts), que usa o localStorage:
// cada tela grava a data/hora em que foi aberta; o contador conta os itens com data posterior

// Área do app: quem é tutor tem contadores separados na área do aluno e na do tutor
export type AreaContador = "professor" | "aluno" | "tutor"

// O que foi visitado: "notas", "chat:<id_tutoria>" ou "avisos:<id_sala>"
export type SufixoVisita = "notas" | `chat:${string}` | `avisos:${string}`

// Datas já lidas do AsyncStorage (chave -> milissegundos)
export type Visitas = Record<string, number>

const PREFIXO = "protutal:visita"

// Mesmo formato de chave do site: área e id do usuário para não misturar contas no mesmo aparelho.
// Ex.: "protutal:visita:aluno:12:chat:5"
export function chaveVisita(area: AreaContador, idUsuario: string, sufixo: SufixoVisita){
    return `${PREFIXO}:${area}:${idUsuario}:${sufixo}`
}

// Lê várias chaves de uma vez. Chave sem data (ou com valor inválido) fica de fora do resultado
export async function lerVisitas(chaves: string[]): Promise<Visitas> {
    const visitas: Visitas = {}

    try {
        const pares = await AsyncStorage.multiGet(chaves)

        for(const [chave, valor] of pares){
            const data = valor ? Date.parse(valor) : NaN
            if(!Number.isNaN(data)) visitas[chave] = data
        }
    } catch {
        // Falha na leitura: segue sem datas (os contadores de última visita ficam zerados)
    }

    return visitas
}

// Grava "agora" como a última visita de várias chaves. Devolve as datas gravadas,
// para a memória ser atualizada mesmo se o AsyncStorage falhar
export async function gravarVisitas(chaves: string[]): Promise<Visitas> {
    const agora = new Date()
    const visitas: Visitas = {}

    for(const chave of chaves) visitas[chave] = agora.getTime()

    if(chaves.length === 0) return visitas

    try {
        await AsyncStorage.multiSet(chaves.map((chave) => [chave, agora.toISOString()]))
    } catch {
        // Sem como guardar: vale só enquanto o app estiver aberto
    }

    return visitas
}

// Quantas datas (ISO, como a API devolve) são posteriores à última visita
export function contarDepois(datas: string[], desde: number | undefined){
    if(desde === undefined) return 0

    return datas.filter((data) => Date.parse(data) > desde).length
}
