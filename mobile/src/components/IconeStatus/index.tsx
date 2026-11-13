import React, { ComponentProps, useContext } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AcessibilidadeContext } from "../../contexts/AcessibilidadeContext";

type NomeIcone = ComponentProps<typeof MaterialCommunityIcons>["name"];

// Mesmo mapa texto → ícone do site (design/src/lib/iconesStatus.tsx)
const ICONES: Record<string, NomeIcone> = {
    // Atividades
    "Entregue": "check",
    "Entregue com atraso": "clock-alert-outline",
    "Não enviou": "circle-outline",
    "Encerrada": "lock-outline",
    "Para corrigir": "pencil-outline",
    "Com nota": "check-all",
    "Sem nota": "circle-outline",
    // Contestações
    "Pendente": "clock-outline",
    "Aceita": "check-circle-outline",
    "Recusada": "close-circle-outline",
    "Contestação pendente": "clock-outline",
    "Contestação aceita": "check-circle-outline",
    "Contestação recusada": "close-circle-outline",
    "Contestada": "message-alert-outline",
    // Tutorias
    "Ativa": "play-circle-outline",
    "Finalizada": "flag-outline",
    // Faixas de desempenho
    "Dominado": "trophy-outline",
    "Com dificuldade": "alert-outline",
    // Tutores
    "Pode criar atividades": "check-circle-outline",
    "Não cria atividades": "cancel",
    // Outros
    "Comunicado": "bullhorn-outline",
    "Removido da sala": "account-minus-outline",
    "Revogado": "cancel",
};

interface IconeStatusProps {
    texto: unknown;
    color: string;
    size?: number;
}

// Ícone ao lado do texto de status. Só aparece no modo daltônico: a informação deixa de
// depender só da cor. Texto fora do mapa (ex.: "2ª etapa") fica sem ícone, como no site.
export function IconeStatus({ texto, color, size = 14 }: IconeStatusProps){
    const { daltonico } = useContext(AcessibilidadeContext);

    if(!daltonico || typeof texto !== "string") return null;

    // "Revogado em 10/05/2026" usa o ícone de "Revogado"
    const chave = texto.startsWith("Revogado") ? "Revogado" : texto;
    const nome = ICONES[chave];

    if(!nome) return null;

    return (
        <MaterialCommunityIcons
        name={nome}
        size={size}
        color={color}
        accessibilityElementsHidden
        importantForAccessibility="no"
        />
    )
}
