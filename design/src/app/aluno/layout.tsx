import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { getNomeServer, getPerfilServer } from '@/lib/cookieServer'
import { getAutenticado } from '@/lib/apiServer'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { LINK_TUTOR, MENU_ALUNO } from '@/lib/menus'

// Moldura de todas as telas do aluno: Header em cima e a página embaixo.
// O middleware já barra quem não é aluno; conferimos de novo aqui por segurança.
export default async function AlunoLayout({ children }: { children: React.ReactNode }){
    const perfil = await getPerfilServer()

    if(perfil !== "aluno") redirect(perfil ? `/${perfil}` : "/")

    // Tutor é aluno com vínculo ativo: a rota T1 só responde 200 para ele.
    // 403 (não é tutor), 500 ou sem conexão: o item fica escondido, sem toast
    // (os cards da página já avisam quando a API está fora)
    const tutorias = await getAutenticado("/tutores/me/tutorias")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in tutorias) sessaoExpiradaNaPagina(tutorias.erro)

    const ehTutor = "dados" in tutorias
    const nome = await getNomeServer()

    return (
        <>
            <Header links={ehTutor ? [...MENU_ALUNO, LINK_TUTOR] : MENU_ALUNO} nome={nome} />
            {children}
        </>
    )
}
