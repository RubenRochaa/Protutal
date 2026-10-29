import styles from './page.module.scss'
import { Loading } from '@/components/loading'

// Aparece enquanto o servidor busca as salas na API (o Header do layout continua na tela)
export default function LoadingProfessor(){
    return (
        <main className={styles.conteudo}>
            <Loading mensagem="Carregando suas salas..." />
        </main>
    )
}
