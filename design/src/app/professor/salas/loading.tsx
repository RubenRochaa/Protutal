import styles from '../page.module.scss'
import { Loading } from '@/components/loading'

// Aparece enquanto o layout da sala busca os dados na API (rota P1).
// Sem este arquivo, apareceria o "Carregando suas salas..." da tela anterior.
export default function LoadingSala(){
    return (
        <main className={styles.conteudo}>
            <Loading mensagem="Carregando sala..." />
        </main>
    )
}
