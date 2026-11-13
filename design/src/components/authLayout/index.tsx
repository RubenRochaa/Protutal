import styles from './styles.module.scss'
import Image from 'next/image'
import Link from 'next/link'
import { Mascote } from '../mascote'
import { MASCOTES } from '@/lib/mascotes'
import { BotaoAcessibilidade } from '../acessibilidade'

interface Props {
    // sem aba (ex.: esqueci a senha e redefinir senha): as duas abas aparecem sem destaque
    aba?: "entrar" | "cadastrar";
    // true só no login: a logo e o mascote do painel carregam com prioridade (preload)
    mascotePrioritario?: boolean;
    children: React.ReactNode;
}

// Quantidade de "PROTUTAL" repetidos na marca d'água do painel
const MARCA_DAGUA = Array.from({ length: 80 });

// Moldura das telas de login e cadastro: painel vermelho com marca d'água, a logo, a frase e o mascote
// "em pé" na base e, à direita, o cartão com as abas ENTRAR / CADASTRAR, o formulário (children)
// e o link da Ajuda
export function AuthLayout({ aba, mascotePrioritario = false, children }: Props){
    return (
        <main className={styles.container}>
            {/* Botão de Acessibilidade no canto superior direito, em todas as larguras */}
            <BotaoAcessibilidade />

            <section className={styles.painel}>
                <div className={styles.marcaDagua} aria-hidden="true">
                    {MARCA_DAGUA.map((_, i) => <span key={i}>PROTUTAL</span>)}
                </div>
                <div className={styles.marca}>
                    <h1 className={styles.logo}>
                        <Image
                        src="/img/logo_modoEscuro.png"
                        alt="Protutal"
                        width={890}
                        height={280}
                        preload={mascotePrioritario}
                        className={styles.logoImagem}
                        />
                    </h1>
                    <p className={styles.frase}>Tutoria entre alunos da rede SESI</p>
                </div>
                <Mascote imagem={MASCOTES.telaInicial} className={styles.mascote} preload={mascotePrioritario} />
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

                    {/* Ajuda pública (seção "Geral" do FAQ): para quem não consegue entrar */}
                    <Link href="/ajuda" className={`${styles.ajuda} link-texto`}>
                        Precisa de ajuda?
                    </Link>
                </div>
            </section>
        </main>
    )
}
