"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { Sala } from '@/lib/types'
import { Card } from '@/components/card'
import { Select } from '@/components/select'
import { EmptyState } from '@/components/emptyState'
import { BotaoExportar } from '../../../components/botaoExportar'

interface Props {
    salas: Sala[];
}

const OPCOES_ETAPA = [
    { valor: "", rotulo: "Todas as etapas" },
    { valor: "1", rotulo: "1ª etapa" },
    { valor: "2", rotulo: "2ª etapa" },
    { valor: "3", rotulo: "3ª etapa" },
]

// Selects da p16 ajustados ao que a P15 recebe: sala (obrigatória) e etapa (opcional)
export function FormExportar({ salas }: Props){
    const [sala, setSala] = useState("");
    const [etapa, setEtapa] = useState("");

    if(salas.length === 0){
        return <Card><EmptyState mensagem={`Você ainda não tem salas. Crie uma sala no menu "Salas".`} /></Card>
    }

    // Salas do ano mais novo primeiro
    const ordenadas = [...salas].sort((a, b) => b.ano_letivo - a.ano_letivo || a.nome.localeCompare(b.nome))

    return (
        <Card className={styles.cartao}>
            <p className={lista.ajuda}>
                A planilha (.xlsx) traz as notas lançadas na sala, com aluno, atividade, etapa, conteúdo, tutor e nota.
            </p>

            <div className={styles.campos}>
                <Select
                label="Sala"
                name="exportar_sala"
                placeholder="Selecione a sala"
                opcoes={ordenadas.map((s) => ({ valor: String(s.id_sala), rotulo: `${s.nome} (${s.serie}ª série, ${s.ano_letivo})` }))}
                value={sala}
                onChange={(e) => setSala(e.target.value)}
                />

                <Select
                label="Etapa"
                name="exportar_etapa"
                opcoes={OPCOES_ETAPA}
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                />
            </div>

            <div className={styles.acao}>
                <BotaoExportar idSala={sala ? Number(sala) : null} filtros={{ etapa }} />
            </div>
        </Card>
    )
}
