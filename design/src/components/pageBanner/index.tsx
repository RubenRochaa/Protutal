import styles from './styles.module.scss'
import { Mascote } from '../mascote'
import { ImagemMascote } from '@/lib/mascotes'

interface Props {
    titulo: string;
    // Mascote à direita da faixa (só no "Bem-vindo ao Protutal!" do início).
    // Carrega com prioridade (preload), porque aparece no topo da página
    imagem?: ImagemMascote;
}

// Faixa em degradê vermelho -> vinho com o título da página, logo abaixo do Header.
// O conteúdo fica num container da mesma largura das páginas, alinhado com os cards
export function PageBanner({ titulo, imagem }: Props){
    return (
        <section className={imagem ? `${styles.banner} ${styles.comImagem}` : styles.banner}>
            <div className={styles.conteudo}>
                <h1 className={styles.titulo}>{titulo}</h1>
                {imagem && <Mascote imagem={imagem} className={styles.imagem} preload />}
            </div>
        </section>
    )
}
