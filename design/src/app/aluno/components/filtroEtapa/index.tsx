"use client"

import { useRouter } from 'next/navigation'
import { Select } from '@/components/select'

const OPCOES = [
    { valor: "", rotulo: "Todas as etapas" },
    { valor: "1", rotulo: "1ª etapa" },
    { valor: "2", rotulo: "2ª etapa" },
    { valor: "3", rotulo: "3ª etapa" },
]

interface Props {
    // Etapa já validada pela página ("" = todas)
    etapa: string;
    // Página que recebe o filtro (ex.: "/aluno/atividades", "/aluno/desempenho")
    caminho: string;
}

// Filtro de etapa: só muda a URL (?etapa=). Quem chama a API é a página, no servidor
export function FiltroEtapa({ etapa, caminho }: Props){
    const router = useRouter();

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>){
        const valor = e.target.value;
        router.push(valor ? `${caminho}?etapa=${valor}` : caminho);
    }

    return (
        <Select
        label="Etapa"
        name="etapa"
        opcoes={OPCOES}
        value={etapa}
        onChange={handleChange}
        />
    )
}
