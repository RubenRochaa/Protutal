import { Header } from '@/components/header'
import { AreaComRodape } from '@/components/footer/areaComRodape'
import { getCookieServer, getNomeServer, getPerfilServer } from '@/lib/cookieServer'
import { getAutenticado } from '@/lib/apiServer'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { MENU_ALUNO, MENU_PROFESSOR } from '@/lib/menus'
import { BotaoAcessibilidade } from '@/components/acessibilidade'

// Moldura da página de Ajuda. Ela fica fora das áreas /professor e /aluno,
// então o menu do Header é escolhido aqui pelo cookie "perfil".
// A página é pública: logado = cookies "session" e "perfil" (mesma regra do middleware).
// Quem não está logado vê a moldura pública: sem Header/menu, só o conteúdo e o rodapé
export default async function AjudaLayout({ children }: { children: React.ReactNode }){
    const token = await getCookieServer()
    const perfil = await getPerfilServer()

    if(!token || !perfil){
        return (
            <AreaComRodape>
                {/* Sem Header: o botão de Acessibilidade fica no canto superior direito */}
                <BotaoAcessibilidade />
                {children}
            </AreaComRodape>
        )
    }

    const nome = await getNomeServer()

    if(perfil === "professor"){
        return (
            <AreaComRodape>
                <Header links={MENU_PROFESSOR} inicio="/professor" nome={nome} perfil={{ rotulo: "Professor" }} />
                {children}
            </AreaComRodape>
        )
    }

    // Mesma regra do layout do aluno: o ícone de troca para /tutor só aparece se a rota T1 responder 200
    const tutorias = await getAutenticado("/tutores/me/tutorias")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in tutorias) sessaoExpiradaNaPagina(tutorias.erro)

    const ehTutor = "dados" in tutorias

    return (
        <AreaComRodape>
            <Header
            links={MENU_ALUNO}
            inicio="/aluno"
            nome={nome}
            perfil={{ rotulo: "Aluno", trocarPara: ehTutor ? "/tutor" : undefined }}
            />
            {children}
        </AreaComRodape>
    )
}
