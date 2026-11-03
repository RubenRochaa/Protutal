import styles from './styles.module.scss'
import { Footer } from './index'

// Moldura das áreas logadas: ocupa no mínimo a altura da janela e o conteúdo (Header + página)
// cresce para preencher o espaço. Assim, em páginas curtas, o rodapé fica no fim da janela
export function AreaComRodape({ children }: { children: React.ReactNode }){
    return (
        <div className={styles.moldura}>
            <div className={styles.conteudo}>{children}</div>
            <Footer />
        </div>
    )
}
