import {
    Ban, CircleCheck, CircleDashed, CirclePlay, CircleX, Clock, ClockAlert, Check, CheckCheck,
    Flag, Lock, LucideIcon, Megaphone, MessageSquareWarning, PencilLine, Trophy, TriangleAlert, UserMinus,
} from 'lucide-react'

// Ícone de cada status do site (modo daltônico, RNF15): com o modo ligado, o status aparece
// com ícone + texto, e não só com a cor do selo. A chave é o texto que o selo já mostra.
// Texto que não está aqui (ex.: "2ª etapa", "Professor") fica sem ícone.
const ICONES: Record<string, LucideIcon> = {
    // Atividades
    "Entregue": Check,
    "Entregue com atraso": ClockAlert,
    "Não enviou": CircleDashed,
    "Encerrada": Lock,
    "Para corrigir": PencilLine,
    "Com nota": CheckCheck,
    "Sem nota": CircleDashed,

    // Contestações
    "Pendente": Clock,
    "Aceita": CircleCheck,
    "Recusada": CircleX,
    "Contestação pendente": Clock,
    "Contestação aceita": CircleCheck,
    "Contestação recusada": CircleX,
    "Contestada": MessageSquareWarning,

    // Tutorias
    "Ativa": CirclePlay,
    "Finalizada": Flag,

    // Faixas de desempenho
    "Dominado": Trophy,
    "Com dificuldade": TriangleAlert,

    // Tutores
    "Pode criar atividades": CircleCheck,
    "Não cria atividades": Ban,

    // Outros selos
    "Comunicado": Megaphone,
    "Removido da sala": UserMinus,
    "Revogado": Ban,
}

// Só aparece com o modo daltônico ligado (classe global "icone-daltonico" do globals.scss).
// aria-hidden: o texto do selo, ao lado, já é lido pelo leitor de tela
export function IconeStatus({ texto }: { texto: React.ReactNode }){
    if(typeof texto !== "string") return null

    // "Revogado em 10/05/2026": o começo do texto é o status
    const chave = texto.trim().startsWith("Revogado") ? "Revogado" : texto.trim()
    const Icone = ICONES[chave]
    if(!Icone) return null

    return <Icone className="icone-daltonico" aria-hidden="true" />
}
