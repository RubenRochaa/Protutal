import styles from './styles.module.scss'
import { IconeStatus } from '@/lib/iconesStatus'

interface Props {
    // Texto do selo (ex.: "Ativa", "Pendente")
    texto: string;
    cor: "verde" | "vermelho" | "cinza";
}

// Selo arredondado de status, no mesmo estilo do selo "Entregue" do detalhe da atividade
export function SeloStatus({ texto, cor }: Props){
    // Com o modo daltônico ligado, o status também ganha um ícone (lib/iconesStatus.tsx)
    return (
        <span className={`${styles.selo} ${styles[cor]}`}>
            <IconeStatus texto={texto} />
            {texto}
        </span>
    )
}
