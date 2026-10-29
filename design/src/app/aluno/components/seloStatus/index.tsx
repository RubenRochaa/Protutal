import styles from './styles.module.scss'

interface Props {
    // Texto do selo (ex.: "Ativa", "Pendente")
    texto: string;
    cor: "verde" | "vermelho" | "cinza";
}

// Selo arredondado de status, no mesmo estilo do selo "Entregue" do detalhe da atividade
export function SeloStatus({ texto, cor }: Props){
    return <span className={`${styles.selo} ${styles[cor]}`}>{texto}</span>
}
