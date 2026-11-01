import styles from './styles.module.scss'
import { iniciais } from '@/lib/formatacao'

interface Props {
    nome: string;
    // "medio" (padrão) nas listas; "grande" no Header
    tamanho?: "medio" | "grande";
}

// Círculo vermelho com as iniciais do nome. A API não devolve foto de aluno nem de professor
export function Avatar({ nome, tamanho = "medio" }: Props){
    return (
        <span
        className={tamanho === "grande" ? `${styles.avatar} ${styles.grande}` : styles.avatar}
        title={nome}
        aria-hidden="true"
        >
            {iniciais(nome)}
        </span>
    )
}
