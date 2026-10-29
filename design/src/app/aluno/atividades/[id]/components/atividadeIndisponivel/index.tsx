import styles from './styles.module.scss'
import Link from 'next/link'

// A A2 recusou a atividade: não existe (404), não é do aluno (403) ou o id é inválido (400).
// Também aparece quem é o tutor criador, até a visão dele existir (lote B3).
// Sem toast: a mensagem fica no quadro, com o caminho de volta para a lista
export function AtividadeIndisponivel(){
    return (
        <div className={styles.quadro} role="alert">
            <p className={styles.mensagem}>Atividade não encontrada ou você não tem acesso a ela.</p>

            <Link href="/aluno/atividades" className={styles.botao}>
                Voltar para Minhas atividades
            </Link>
        </div>
    )
}
