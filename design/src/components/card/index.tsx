import styles from './styles.module.scss'
import { Mascote } from '../mascote'
import { ImagemMascote } from '@/lib/mascotes'

interface Props {
    titulo?: string;
    // Mantida para não quebrar as telas: hoje o cabeçalho é o mesmo com ou sem ela
    sublinhado?: boolean;
    className?: string;
    // Mascote pequeno (64 px) ao lado do título (ex.: painéis de desempenho). Só aparece com título
    imagem?: ImagemMascote;
    // Link ou botão à direita do título (ex.: "Ver todas"). Só aparece com título
    acao?: React.ReactNode;
    children: React.ReactNode;
}

// Caixa branca com borda fina e sombra leve, usada em quase todas as telas.
// O título é opcional; com ele, o cabeçalho ganha uma linha separadora embaixo.
// O card ocupa toda a altura da célula da grade, então cards da mesma linha ficam iguais
export function Card({ titulo, className, imagem, acao, children }: Props){
    return (
        <section className={className ? `${styles.card} ${className}` : styles.card}>
            {titulo && (
                <div className={styles.cabecalho}>
                    <div className={styles.tituloGrupo}>
                        {imagem && <Mascote imagem={imagem} className={styles.imagem} />}
                        <h2 className={styles.titulo}>{titulo}</h2>
                    </div>

                    {acao && <div className={styles.acao}>{acao}</div>}
                </div>
            )}

            {children}
        </section>
    )
}
