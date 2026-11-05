import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { getPerfilServer } from '@/lib/cookieServer'

// Menu do professor, na ordem do Figma. "Tutoria" e "Desempenho" ainda não têm tela
const LINKS = [
    { label: "Início", href: "/professor" },
    { label: "Salas", href: "/professor#salas" },
    { label: "Tutoria", href: "/professor/tutoria", emBreve: true },
    { label: "Desempenho", href: "/professor/desempenho", emBreve: true },
]

// Moldura de todas as telas do professor: Header em cima e a página embaixo.
// O middleware já barra quem não é professor; conferimos de novo aqui por segurança.
export default async function ProfessorLayout({ children }: { children: React.ReactNode }){
    const perfil = await getPerfilServer()

    if(perfil !== "professor") redirect(perfil ? `/${perfil}` : "/")

    return (
        <>
            <Header links={LINKS} />
            {children}
        </>
    )
}
