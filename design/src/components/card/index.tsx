import styles from './styles.module.scss'

interface Props {
    titulo?: string;
    sublinhado?: boolean;
    className?: string;
    children: React.ReactNode;
}

// Caixa cinza arredondada com sombra, usada em quase todas as telas.
// O título é opcional; "sublinhado" deixa o título como nos cards da tela Tutoria
export function Card({ titulo, sublinhado = false, className, children }: Props){
    return (
        <section className={className ? `${styles.card} ${className}` : styles.card}>
            {titulo && (
                <h2 className={sublinhado ? `${styles.titulo} ${styles.sublinhado}` : styles.titulo}>
                    {titulo}
                </h2>
            )}

            {children}
        </section>
    )
}
