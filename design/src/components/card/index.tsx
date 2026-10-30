import styles from './styles.module.scss'
import { Mascote } from '../mascote'
import { ImagemMascote } from '@/lib/mascotes'

interface Props {
    titulo?: string;
    sublinhado?: boolean;
    className?: string;
    // Mascote pequeno (64 px) ao lado do título (ex.: painéis de desempenho). Só aparece com título
    imagem?: ImagemMascote;
    children: React.ReactNode;
}

// Caixa cinza arredondada com sombra, usada em quase todas as telas.
// O título é opcional; "sublinhado" deixa o título como nos cards da tela Tutoria
export function Card({ titulo, sublinhado = false, className, imagem, children }: Props){
    const h2 = titulo && (
        <h2 className={sublinhado ? `${styles.titulo} ${styles.sublinhado}` : styles.titulo}>
            {titulo}
        </h2>
    )

    return (
        <section className={className ? `${styles.card} ${className}` : styles.card}>
            {h2 && imagem ? (
                <div className={styles.cabecalho}>
                    <Mascote imagem={imagem} className={styles.imagem} />
                    {h2}
                </div>
            ) : h2}

            {children}
        </section>
    )
}
