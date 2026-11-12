"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { buscarDadosContadores, DadosContadores } from './contadoresActions'
import { ChaveContador } from './menus'
import { AreaContador, chaveVisita, contarDepois, gravarVisita, iniciarVisita, lerVisita, SufixoVisita } from './ultimaVisita'

// No máximo uma atualização por minuto, além das trocas de página
const INTERVALO = 60_000

interface Contadores {
    // Itens do menu do Header (ver "contador" em lib/menus.ts)
    menu: Partial<Record<ChaveContador, number>>;
    // Mensagens novas do chat de cada tutoria (id_tutoria -> quantidade)
    chatPorTutoria: Record<number, number>;
    // Chat + avisos da sala de cada tutoria (card da lista de tutorias do aluno)
    porTutoria: Record<number, number>;
}

interface ValorContexto extends Contadores {
    // Usado pelo MarcarVisita: a tela aberta grava a visita e continua "vista" enquanto estiver aberta
    registrarVisita: (sufixo: SufixoVisita) => () => void;
}

const ZERADOS: Contadores = { menu: {}, chatPorTutoria: {}, porTutoria: {} }

// Sem provider (ex.: Header da página /ajuda) tudo fica zerado e nada acende
const ContextoContadores = createContext<ValorContexto>({ ...ZERADOS, registrarVisita: () => () => {} })

// Sufixos de "última visita" que existem nos dados recebidos.
// "notas" entra sempre no aluno: sem nota nenhuma ainda, a primeira lançada já precisa contar
function sufixosDosDados(area: AreaContador, dados: DadosContadores){
    const sufixos: SufixoVisita[] = dados.tutorias.map((tutoria) => `chat:${tutoria.id_tutoria}` as const)

    for(const sala of dados.avisos) sufixos.push(`avisos:${sala.id_sala}`)
    if(area === "aluno") sufixos.push("notas")

    return sufixos
}

// Junta os contadores por status (já contados no servidor) com os de "última visita" (localStorage)
function calcular(area: AreaContador, dados: DadosContadores): Contadores {
    const idUsuario = dados.idUsuario

    // Sem id não dá para montar a chave: os contadores de última visita ficam zerados
    const desde = (sufixo: SufixoVisita) => idUsuario ? lerVisita(chaveVisita(area, idUsuario, sufixo)) : null

    const avisosPorSala: Record<number, number> = {}
    let totalAvisos = 0

    for(const sala of dados.avisos){
        avisosPorSala[sala.id_sala] = contarDepois(sala.datas, desde(`avisos:${sala.id_sala}`))
        totalAvisos += avisosPorSala[sala.id_sala]
    }

    const chatPorTutoria: Record<number, number> = {}
    const porTutoria: Record<number, number> = {}
    let totalChat = 0

    for(const tutoria of dados.tutorias){
        chatPorTutoria[tutoria.id_tutoria] = contarDepois(tutoria.mensagens, desde(`chat:${tutoria.id_tutoria}`))
        porTutoria[tutoria.id_tutoria] = chatPorTutoria[tutoria.id_tutoria] + (avisosPorSala[tutoria.id_sala] ?? 0)
        totalChat += chatPorTutoria[tutoria.id_tutoria]
    }

    return {
        menu: {
            ...dados.status,
            desempenho: contarDepois(dados.notas, desde("notas")),
            tutoria: totalChat + totalAvisos
        },
        chatPorTutoria,
        porTutoria
    }
}

interface Props {
    area: AreaContador;
    children: React.ReactNode;
}

// Envolve o Header e as páginas de cada área (layout). Busca os dados ao abrir a área,
// a cada troca de página e a cada 60 s (só com a aba visível). Header e páginas leem o mesmo resultado,
// então os contadores dentro das telas não fazem chamada extra
export function ProvedorContadores({ area, children }: Props){
    const pathname = usePathname()
    const [dados, setDados] = useState<DadosContadores | null>(null)
    // Muda quando uma visita é gravada, para recalcular sem buscar de novo
    const [, setVersao] = useState(0)
    const idUsuario = useRef<string | null>(null)
    // Telas abertas agora (MarcarVisita montado). O número é quantas vezes o mesmo sufixo está montado
    const abertas = useRef(new Map<string, number>())
    // Só a resposta da busca mais recente vale (uma troca de página rápida não sobrescreve com dado velho)
    const ultimaBusca = useRef(0)

    const buscar = useCallback(async () => {
        const numero = ++ultimaBusca.current

        try {
            const resposta = await buscarDadosContadores(area)

            if(numero !== ultimaBusca.current) return

            idUsuario.current = resposta?.idUsuario ?? null

            if(resposta && resposta.idUsuario){
                // Primeira vez de cada item: considera tudo como já visto
                for(const sufixo of sufixosDosDados(area, resposta)) iniciarVisita(chaveVisita(area, resposta.idUsuario, sufixo))

                // Tela aberta continua vista: mensagem nova no chat aberto não acende a bolinha
                for(const sufixo of abertas.current.keys()) gravarVisita(chaveVisita(area, resposta.idUsuario, sufixo as SufixoVisita))
            }

            setDados(resposta)
        } catch {
            // API fora ou sem conexão: mantém os últimos contadores, sem toast
        }
    }, [area])

    useEffect(() => {
        buscar()
    }, [pathname, buscar])

    useEffect(() => {
        const intervalo = setInterval(() => {
            if(!document.hidden) buscar()
        }, INTERVALO)

        return () => clearInterval(intervalo)
    }, [buscar])

    const registrarVisita = useCallback((sufixo: SufixoVisita) => {
        const mapa = abertas.current
        mapa.set(sufixo, (mapa.get(sufixo) ?? 0) + 1)

        // Se o id ainda não chegou, a visita é gravada quando a busca terminar
        if(idUsuario.current){
            gravarVisita(chaveVisita(area, idUsuario.current, sufixo))
            setVersao((v) => v + 1)
        }

        return () => {
            const restantes = (mapa.get(sufixo) ?? 1) - 1

            if(restantes <= 0) mapa.delete(sufixo)
            else mapa.set(sufixo, restantes)
        }
    }, [area])

    // Leitura simples do localStorage: recalcula a cada render (dados novos ou visita gravada)
    const contadores = dados ? calcular(area, dados) : ZERADOS

    return (
        <ContextoContadores.Provider value={{ ...contadores, registrarVisita }}>
            {children}
        </ContextoContadores.Provider>
    )
}

export function useContadores(){
    return useContext(ContextoContadores)
}
