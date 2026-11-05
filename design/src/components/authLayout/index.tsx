import styles from './styles.module.scss'
import Link from 'next/link'

interface Props {
    aba: "entrar" | "cadastrar";
    children: React.ReactNode;
}

// Quantidade de "PROTUTAL" repetidos na marca d'água do painel
const MARCA_DAGUA = Array.from({ length: 80 });

// Moldura das telas de login e cadastro: painel vermelho com o logo à esquerda
// e, à direita, o cartão com as abas ENTRAR / CADASTRAR e o formulário (children)
export function AuthLayout({ aba, children }: Props){
    return (
        <main className={styles.container}>
            <section className={styles.painel}>
                <div className={styles.marcaDagua} aria-hidden="true">
                    {MARCA_DAGUA.map((_, i) => <span key={i}>PROTUTAL</span>)}
                </div>
                <h1 className={styles.logo}>PROTUTAL</h1>
            </section>

            <section className={styles.conteudo}>
                <div className={styles.cartao}>
                    <nav className={styles.abas}>
                        <Link
                        href="/"
                        className={aba === "entrar" ? styles.abaAtiva : styles.aba}
                        aria-current={aba === "entrar" ? "page" : undefined}
                        >
                            ENTRAR
                        </Link>
                        <Link
                        href="/cadastro"
                        className={aba === "cadastrar" ? styles.abaAtiva : styles.aba}
                        aria-current={aba === "cadastrar" ? "page" : undefined}
                        >
                            CADASTRAR
                        </Link>
                    </nav>

                    {children}
                </div>
            </section>
        </main>
    )
}
