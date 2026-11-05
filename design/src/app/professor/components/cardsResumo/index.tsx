import styles from './styles.module.scss'
import { Card } from '@/components/card'

// Cards do Figma. Nenhuma rota da API devolve estes números prontos,
// então eles aparecem desabilitados, com "Em breve" (sem dado inventado).
const CARDS = [
    "Alunos em tutoria",
    "Desempenho por trimestre",
    "Tutores ativos",
    "Exportar notas",
]

export function CardsResumo(){
    return (
        <div className={styles.grade}>
            {CARDS.map((titulo) => (
                <Card key={titulo} titulo={titulo} className={styles.card}>
                    <div className={styles.corpo} aria-disabled="true">
                        <span className={styles.emBreve}>Em breve</span>
                    </div>
                </Card>
            ))}
        </div>
    )
}
