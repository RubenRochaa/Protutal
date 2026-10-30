import styles from './styles.module.scss'
import { Loader } from '../loader'

interface Props {
    mensagem?: string;
    // "grande" no loading.tsx de página inteira; "medio" (padrão) em seções e cards
    size?: "medio" | "grande";
}

// Indicador de carregamento no mesmo quadro branco do EmptyState.
// Pode ser usado direto no loading.tsx da rota: export default function LoadingPage(){ return <Loading /> }
export function Loading({ mensagem = "Carregando...", size = "medio" }: Props){
    return (
        <div className={styles.quadro} role="status" aria-live="polite">
            <Loader size={size} decorativo />
            <p className={styles.mensagem}>{mensagem}</p>
        </div>
    )
}
