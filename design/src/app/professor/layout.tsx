import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { getNomeServer, getPerfilServer } from '@/lib/cookieServer'
import { MENU_PROFESSOR } from '@/lib/menus'

// Moldura de todas as telas do professor: Header em cima e a página embaixo.
// O middleware já barra quem não é professor; conferimos de novo aqui por segurança.
export default async function ProfessorLayout({ children }: { children: React.ReactNode }){
    const perfil = await getPerfilServer()

    if(perfil !== "professor") redirect(perfil ? `/${perfil}` : "/")

    const nome = await getNomeServer()

    return (
        <>
            <Header links={MENU_PROFESSOR} nome={nome} />
            {children}
        </>
    )
}
