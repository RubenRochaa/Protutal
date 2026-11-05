import styles from './styles.module.scss'

interface Props {
    titulo: string;
}

// Faixa em degradê vermelho -> vinho com o título da página, logo abaixo do Header
export function PageBanner({ titulo }: Props){
    return (
        <section className={styles.banner}>
            <h1 className={styles.titulo}>{titulo}</h1>
        </section>
    )
}
