import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Sala } from '@/lib/types'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'

interface Props {
    salas: Sala[];
    // Aba da sala para onde cada item leva (ex.: "tutorias" ou "desempenho")
    aba: string;
    mensagemVazia: string;
}

// Salas agrupadas por ano letivo (do mais novo para o mais antigo), cada uma num item clicável.
// A P20 não tem filtro de ano: o agrupamento é feito aqui, na memória.
export function SalasPorAno({ salas, aba, mensagemVazia }: Props){
    if(salas.length === 0) return <Card><EmptyState mensagem={mensagemVazia} /></Card>;

    const anos = [...new Set(salas.map((s) => s.ano_letivo))].sort((a, b) => b - a)

    return (
        <div className={styles.grade}>
            {anos.map((ano) => (
                <Card key={ano} titulo={String(ano)} sublinhado>
                    <ul className={lista.lista}>
                        {salas.filter((s) => s.ano_letivo === ano).map((sala) => (
                            <li key={sala.id_sala}>
                                <Link href={`/professor/salas/${sala.id_sala}/${aba}`} className={lista.link}>
                                    <ListItem direita={<ChevronRight size={20} aria-hidden="true" />}>
                                        <span className={lista.nome}>{sala.nome}</span>
                                        <span className={lista.detalhe}>{sala.serie}ª série</span>
                                    </ListItem>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Card>
            ))}
        </div>
    )
}
