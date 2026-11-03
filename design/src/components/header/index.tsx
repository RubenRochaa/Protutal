"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { Loader } from '../loader'
import { ArrowLeftRight, Bell, CircleUserRound, Menu, X } from 'lucide-react'
import { iniciais } from '@/lib/formatacao'
import { Avatar } from '../avatar'
import { Etiqueta } from '../etiqueta'
import { handleLogout } from './actions'

interface LinkMenu {
    label: string;
    href: string;
    // Tela ainda não feita: o item aparece desabilitado, com o selo "Em breve"
    emBreve?: boolean;
    // Item mostrado só como ícone, ao lado do avatar (ver ICONES)
    icone?: "notificacao";
}

interface Props {
    links: LinkMenu[];
    // Página inicial do perfil ("/professor", "/aluno", "/tutor"): destino da logo
    inicio: string;
    // Nome do usuário logado, para o avatar com as iniciais. Sem nome, fica o ícone
    nome?: string | null;
    // Tipo de conta mostrado no selo ao lado do avatar. Quem decide é o layout (servidor).
    // trocarPara: só para quem é tutor, destino do ícone de troca ("/tutor" ou "/aluno")
    perfil?: {
        rotulo: "Professor" | "Aluno" | "Tutor";
        trocarPara?: string;
    };
}

// Ícones dos itens que aparecem sem texto, ao lado do avatar
const ICONES = {
    notificacao: Bell,
}

// O link ativo é o de href mais longo que combina com a URL.
// Se mais de um item combinar com a URL, só o mais específico fica vermelho
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
            {pending && <Loader size="pequeno" variant="branco" decorativo />}
            {pending ? "Saindo..." : "Sair"}
        </button>
    )
}

// Cabeçalho das áreas logadas: logo, menu (recebido por props), ícone do usuário e "Sair".
// No celular e tablet os links ficam escondidos atrás do botão de menu.
export function Header({ links, inicio, nome, perfil }: Props){
    const pathname = usePathname();
    const [menuAberto, setMenuAberto] = useState(false);
    const ativo = hrefAtivo(links, pathname);
    const tituloTroca = perfil?.trocarPara === "/tutor" ? "Ir para a área do tutor" : "Ir para a área do aluno";

    // Itens com ícone (ex.: Notificações) ficam ao lado do avatar, fora do menu de texto
    const menu = links.filter((link) => !link.icone);
    const atalhos = links.filter((link) => link.icone);

    return (
        <header className={styles.header}>
            <div className={styles.conteudo}>
                <Link href={inicio} className={styles.logo} aria-label="Protutal - página inicial">
                    <Image
                    src="/img/logo.png"
                    alt="Protutal"
                    width={424}
                    height={62}
                    priority
                    className={styles.logoImagem}
                    />
                </Link>

                <nav
                id="menu-principal"
                className={menuAberto ? `${styles.nav} ${styles.navAberto}` : styles.nav}
                >
                    {menu.map((link) => link.emBreve ? (
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
                    {/* Só o ícone aparece; o label vira o nome lido pelo leitor de tela e a dica do mouse */}
                    {atalhos.map((link) => {
                        const Icone = ICONES[link.icone!]

                        return (
                            <Link
                            key={link.href}
                            href={link.href}
                            className={link.href === ativo ? `${styles.atalho} ${styles.atalhoAtivo}` : styles.atalho}
                            aria-current={link.href === ativo ? "page" : undefined}
                            aria-label={link.label}
                            title={link.label}
                            >
                                <Icone aria-hidden="true" />
                            </Link>
                        )
                    })}

                    {/* Selo do tipo de conta: só informa, não é clicável */}
                    {perfil && (
                        <span className={styles.selo}>
                            <Etiqueta>{perfil.rotulo}</Etiqueta>
                        </span>
                    )}

                    {/* Só para tutor: alterna entre a área do aluno e a do tutor (mesmo estilo do sino) */}
                    {perfil?.trocarPara && (
                        <Link
                        href={perfil.trocarPara}
                        className={styles.atalho}
                        aria-label={tituloTroca}
                        title={tituloTroca}
                        >
                            <ArrowLeftRight aria-hidden="true" />
                        </Link>
                    )}

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
