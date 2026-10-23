import styles from './styles.module.scss'
import { LoaderCircle } from 'lucide-react'

interface Props {
    mensagem?: string;
}

// Indicador de carregamento no mesmo quadro branco do EmptyState.
// Pode ser usado direto no loading.tsx da rota: export default function LoadingPage(){ return <Loading /> }
export function Loading({ mensagem = "Carregando..." }: Props){
    return (
        <div className={styles.quadro} role="status" aria-live="polite">
            <LoaderCircle className={styles.icone} aria-hidden="true" />
            <p className={styles.mensagem}>{mensagem}</p>
        </div>
    )
}
