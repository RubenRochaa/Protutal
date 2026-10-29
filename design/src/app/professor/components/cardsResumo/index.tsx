import styles from './styles.module.scss'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/card'

// Atalhos do Início para as telas gerais do professor.
// Nenhuma rota da API devolve números prontos para estes cartões,
// por isso cada um mostra só o que a tela faz (sem dado inventado).
const CARDS = [
    { titulo: "Alunos em tutoria", texto: "Ver tutores e tutorados por série", href: "/professor/tutoria" },
    { titulo: "Desempenho por trimestre", texto: "Médias por etapa dos tutorados e tutores", href: "/professor/desempenho" },
    { titulo: "Notificações", texto: "Pedidos para ser tutor e contestações de nota", href: "/professor/notificacoes" },
    { titulo: "Exportar notas", texto: "Baixar as notas da sala em planilha", href: "/professor/exportar-notas" },
]

export function CardsResumo(){
    return (
        <div className={styles.grade}>
            {CARDS.map((card) => (
                <Link key={card.titulo} href={card.href} className={styles.link}>
                    <Card titulo={card.titulo} className={styles.card}>
                        <div className={styles.corpo}>
                            <span className={styles.texto}>{card.texto}</span>
                            <ChevronRight size={18} aria-hidden="true" className={styles.seta} />
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
