import styles from './pagina.module.scss'
import { Loading } from '@/components/loading'

// Aparece enquanto o servidor monta a página (o Header do layout continua na tela)
export default function LoadingTutor(){
    return (
        <main className={styles.conteudo}>
            <Loading />
        </main>
    )
}
