import React from "react";

import { Select } from "../Select";
import { OptionProps } from "../ModalPicker";

// "" = todas as etapas (não envia o filtro para a API)
export type Etapa = "" | "1" | "2" | "3";

// Mesmas opções do filtro do site (3 etapas)
const OPCOES: OptionProps[] = [
    { value: "", label: "Todas as etapas" },
    { value: "1", label: "1ª etapa" },
    { value: "2", label: "2ª etapa" },
    { value: "3", label: "3ª etapa" },
]

interface FiltroEtapaProps {
    etapa: Etapa;
    onChange: (etapa: Etapa) => void;
}

// Filtro de etapa das telas de atividades, desempenho e feedbacks
export function FiltroEtapa({ etapa, onChange }: FiltroEtapaProps){
    return (
        <Select
        label="Etapa"
        options={OPCOES}
        value={etapa}
        onChange={(valor) => onChange(valor as Etapa)}
        />
    )
}
