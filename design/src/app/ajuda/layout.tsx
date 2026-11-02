import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { AreaComRodape } from '@/components/footer/areaComRodape'
import { getNomeServer, getPerfilServer } from '@/lib/cookieServer'
import { getAutenticado } from '@/lib/apiServer'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { LINK_TUTOR, MENU_ALUNO, MENU_PROFESSOR } from '@/lib/menus'

// Moldura da página de Ajuda. Ela fica fora das áreas /professor e /aluno,
// então o menu do Header é escolhido aqui pelo cookie "perfil".
// O middleware já barra quem não está logado; conferimos de novo aqui por segurança.
export default async function AjudaLayout({ children }: { children: React.ReactNode }){
    const perfil = await getPerfilServer()

    if(!perfil) redirect("/")

    const nome = await getNomeServer()

    if(perfil === "professor"){
        return (
            <AreaComRodape>
                <Header links={MENU_PROFESSOR} inicio="/professor" nome={nome} />
                {children}
            </AreaComRodape>
        )
    }

    // Mesma regra do layout do aluno: "Área do tutor" só aparece se a rota T1 responder 200
    const tutorias = await getAutenticado("/tutores/me/tutorias")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in tutorias) sessaoExpiradaNaPagina(tutorias.erro)

    const ehTutor = "dados" in tutorias

    return (
        <AreaComRodape>
            <Header links={ehTutor ? [...MENU_ALUNO, LINK_TUTOR] : MENU_ALUNO} inicio="/aluno" nome={nome} />
            {children}
        </AreaComRodape>
    )
}
