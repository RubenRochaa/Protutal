import styles from './styles.module.scss'

interface Props {
    // "pequeno" = dentro de botões; "medio" = seções e cards; "grande" = página inteira
    size?: "pequeno" | "medio" | "grande";
    // "vermelho" = sobre fundo claro; "branco" = sobre fundo vermelho (botão primário, banner)
    variant?: "vermelho" | "branco";
    // true quando já existe um texto visível de carregamento ao lado (ex.: "Enviando..." no botão).
    // Assim o leitor de tela não anuncia "Carregando" duas vezes.
    decorativo?: boolean;
}

// Anel de carregamento do Protutal, feito só com CSS.
// Ex.: <Loader size="pequeno" variant="branco" decorativo />
export function Loader({ size = "medio", variant = "vermelho", decorativo = false }: Props){
    const classes = [styles.loader, styles[size], styles[variant]].join(" ")

    if(decorativo) return <span className={classes} aria-hidden="true" />;

    return (
        <span className={classes} role="status" aria-live="polite">
            <span className={styles.textoOculto}>Carregando</span>
        </span>
    )
}
