"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { CircleUserRound, Menu, X } from 'lucide-react'
import { handleLogout } from './actions'

interface LinkMenu {
    label: string;
    href: string;
}

interface Props {
    links: LinkMenu[];
}

// O link ativo é o de href mais longo que combina com a URL.
// Assim "Início" (/aluno) não fica vermelho junto com "Minhas atividades" (/aluno/atividades)
function hrefAtivo(links: LinkMenu[], pathname: string){
    const candidatos = links
        .filter((link) => pathname === link.href || pathname.startsWith(link.href + "/"))
        .sort((a, b) => b.href.length - a.href.length)

    return candidatos[0]?.href
}

// Botão "Sair": fica desabilitado enquanto o logout roda no servidor
function BotaoSair(){
    const { pending } = useFormStatus();

    return (
        <button type="submit" disabled={pending} className={styles.sair}>
            {pending ? "Saindo..." : "Sair"}
        </button>
    )
}

// Cabeçalho das áreas logadas: logo, menu (recebido por props), ícone do usuário e "Sair".
// No celular e tablet os links ficam escondidos atrás do botão de menu.
export function Header({ links }: Props){
    const pathname = usePathname();
    const [menuAberto, setMenuAberto] = useState(false);
    const ativo = hrefAtivo(links, pathname);

    return (
        <header className={styles.header}>
            <div className={styles.conteudo}>
                <Link href={links[0]?.href ?? "/"} className={styles.logo} aria-label="Protutal - página inicial">
                    <span className={styles.logoPr}>PR</span>OTUTAL
                </Link>

                <nav
                id="menu-principal"
                className={menuAberto ? `${styles.nav} ${styles.navAberto}` : styles.nav}
                >
                    {links.map((link) => (
                        <Link
                        key={link.href}
                        href={link.href}
                        className={link.href === ativo ? styles.linkAtivo : styles.link}
                        aria-current={link.href === ativo ? "page" : undefined}
                        onClick={() => setMenuAberto(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.acoes}>
                    {/* A API não tem foto de usuário: fica o ícone no lugar */}
                    <CircleUserRound className={styles.usuario} aria-hidden="true" />

                    <form action={handleLogout}>
                        <BotaoSair />
                    </form>

                    <button
                    type="button"
                    className={styles.botaoMenu}
                    onClick={() => setMenuAberto(!menuAberto)}
                    aria-expanded={menuAberto}
                    aria-controls="menu-principal"
                    aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
                    >
                        {menuAberto ? <X size={26} /> : <Menu size={26} />}
                    </button>
                </div>
            </div>
        </header>
    )
}
