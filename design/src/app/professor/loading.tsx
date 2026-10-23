import styles from './styles.module.scss'
import { Loading } from '@/components/loading'

// Aparece enquanto a página busca os dados na API (o Header do layout continua visível)
export default function LoadingProfessor(){
    return (
        <main className={styles.main}>
            <Loading />
        </main>
    )
}
