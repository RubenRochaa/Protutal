"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { CircleUserRound, Menu, X } from 'lucide-react'
import { iniciais } from '@/lib/formatacao'
import { Avatar } from '../avatar'
import { handleLogout } from './actions'

interface LinkMenu {
    label: string;
    href: string;
    // Tela ainda não feita: o item aparece desabilitado, com o selo "Em breve"
    emBreve?: boolean;
}

interface Props {
    links: LinkMenu[];
    // Nome do usuário logado, para o avatar com as iniciais. Sem nome, fica o ícone
    nome?: string | null;
}

// O link ativo é o de href mais longo que combina com a URL.
// Assim "Início" (/aluno) não fica vermelho junto com "Minhas atividades" (/aluno/atividades)
function hrefAtivo(links: LinkMenu[], pathname: string){
    const candidatos = links
        .filter((link) => !link.emBreve)
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
export function Header({ links, nome }: Props){
    const pathname = usePathname();
    const [menuAberto, setMenuAberto] = useState(false);
    const ativo = hrefAtivo(links, pathname);

    return (
        <header className={styles.header}>
            <div className={styles.conteudo}>
                <Link href={links[0]?.href ?? "/"} className={styles.logo} aria-label="Protutal - página inicial">
                    <Image
                    src="/img/logo.png"
                    alt="Protutal"
                    width={890}
                    height={280}
                    priority
                    className={styles.logoImagem}
                    />
                </Link>

                <nav
                id="menu-principal"
                className={menuAberto ? `${styles.nav} ${styles.navAberto}` : styles.nav}
                >
                    {links.map((link) => link.emBreve ? (
                        <span key={link.href} className={styles.linkEmBreve} aria-disabled="true">
                            {link.label}
                            <span className={styles.seloEmBreve}>Em breve</span>
                        </span>
                    ) : (
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
                    {/* A API não tem foto de usuário: avatar com as iniciais do nome (ou o ícone, sem nome) */}
                    {nome && iniciais(nome) ? (
                        <span role="img" aria-label={nome}>
                            <Avatar nome={nome} tamanho="grande" />
                        </span>
                    ) : (
                        <CircleUserRound className={styles.usuario} aria-hidden="true" />
                    )}

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
