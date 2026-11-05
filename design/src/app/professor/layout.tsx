import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { AreaComRodape } from '@/components/footer/areaComRodape'
import { getNomeServer, getPerfilServer } from '@/lib/cookieServer'
import { MENU_PROFESSOR } from '@/lib/menus'
import { ProvedorContadores } from '@/lib/useContadores'

// Moldura de todas as telas do professor: Header em cima e a página embaixo.
// O middleware já barra quem não é professor; conferimos de novo aqui por segurança.
export default async function ProfessorLayout({ children }: { children: React.ReactNode }){
    const perfil = await getPerfilServer()

    if(perfil !== "professor") redirect(perfil ? `/${perfil}` : "/")

    const nome = await getNomeServer()

    return (
        <AreaComRodape>
            {/* Contador do sino (pedidos + contestações pendentes) */}
            <ProvedorContadores area="professor">
                <Header links={MENU_PROFESSOR} inicio="/professor" nome={nome} perfil={{ rotulo: "Professor" }} />
                {children}
            </ProvedorContadores>
        </AreaComRodape>
    )
}
