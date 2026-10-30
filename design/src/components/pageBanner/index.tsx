import styles from './styles.module.scss'
import { Mascote } from '../mascote'
import { ImagemMascote } from '@/lib/mascotes'

interface Props {
    titulo: string;
    // Mascote à direita da faixa (só no "Bem-vindo ao Protutal!" do início).
    // Carrega com prioridade (preload), porque aparece no topo da página
    imagem?: ImagemMascote;
}

// Faixa em degradê vermelho -> vinho com o título da página, logo abaixo do Header
export function PageBanner({ titulo, imagem }: Props){
    return (
        <section className={styles.banner}>
            <h1 className={styles.titulo}>{titulo}</h1>
            {imagem && <Mascote imagem={imagem} className={styles.imagem} preload />}
        </section>
    )
}
