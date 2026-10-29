import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { getNomeServer, getPerfilServer } from '@/lib/cookieServer'

// Menu do professor, na ordem do Figma (p13), mais "Notificações"
// (pedidos e contestações pendentes de todas as salas). "Sair" fica no próprio Header.
const LINKS = [
    { label: "Início", href: "/professor" },
    { label: "Salas", href: "/professor#salas" },
    { label: "Tutoria", href: "/professor/tutoria" },
    { label: "Desempenho", href: "/professor/desempenho" },
    { label: "Notificações", href: "/professor/notificacoes" },
]

// Moldura de todas as telas do professor: Header em cima e a página embaixo.
// O middleware já barra quem não é professor; conferimos de novo aqui por segurança.
export default async function ProfessorLayout({ children }: { children: React.ReactNode }){
    const perfil = await getPerfilServer()

    if(perfil !== "professor") redirect(perfil ? `/${perfil}` : "/")

    const nome = await getNomeServer()

    return (
        <>
            <Header links={LINKS} nome={nome} />
            {children}
        </>
    )
}
