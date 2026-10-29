import styles from './styles.module.scss'
import Link from 'next/link'

// A tutoria do id da URL não está na lista do aluno (A3): não existe, não é dele ou o id é inválido.
// Não há rota de detalhe de tutoria, então o detalhe, o chat e a avaliação procuram na A3.
// Sem toast: a mensagem fica no quadro, com o caminho de volta para a lista
export function TutoriaNaoEncontrada(){
    return (
        <div className={styles.quadro} role="alert">
            <p className={styles.mensagem}>Tutoria não encontrada.</p>

            <Link href="/aluno/tutoria" className={styles.botao}>
                Voltar para Minhas tutorias
            </Link>
        </div>
    )
}
