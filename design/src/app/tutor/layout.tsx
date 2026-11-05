import styles from './pagina.module.scss'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { AreaComRodape } from '@/components/footer/areaComRodape'
import { getNomeServer, getPerfilServer } from '@/lib/cookieServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { ErroCarregamento } from '../professor/components/erroCarregamento'
import { buscarTutorias } from './buscas'
import { LinkMenu } from '@/lib/menus'
import { ProvedorContadores } from '@/lib/useContadores'

// Menu do tutor (estrutura dos prints), sem "Início": a logo leva para lá.
// A volta para as telas de tutorado é o ícone de troca ao lado do selo "Tutor".
// contador: bolinha de notificação (Tutoria soma o chat dos tutorados e os avisos das salas)
const LINKS: LinkMenu[] = [
    { label: "Atividades", href: "/tutor/atividades", contador: "atividades" },
    { label: "Tutoria", href: "/tutor/tutoria", contador: "tutoria" },
    { label: "Contestações", href: "/tutor/contestacoes", contador: "contestacoes" },
    { label: "Feedbacks", href: "/tutor/feedbacks" },
    { label: "Desempenho", href: "/tutor/desempenho" },
]

// Moldura de todas as telas do tutor. Tutor não é perfil de login: ele entra como aluno,
// e a rota T1 diz se ele é tutor (200, mesmo com lista vazia) ou não (403).
export default async function TutorLayout({ children }: { children: React.ReactNode }){
    const perfil = await getPerfilServer()

    if(perfil !== "aluno") redirect(perfil ? `/${perfil}` : "/")

    // Mesma busca (cache) que a página "Tutoria" usa sem filtro
    const tutorias = await buscarTutorias("")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in tutorias){
        sessaoExpiradaNaPagina(tutorias.erro)

        // 403 = não é tutor (ou o vínculo foi revogado): volta para a área do aluno
        if(getErrorStatus(tutorias.erro) === 403) redirect("/aluno")
    }

    const nome = await getNomeServer()

    return (
        <AreaComRodape>
            <ProvedorContadores area="tutor">
                <Header links={LINKS} inicio="/tutor" nome={nome} perfil={{ rotulo: "Tutor", trocarPara: "/aluno" }} />

                {"erro" in tutorias ? (
                    // API fora ou erro 500: não dá para saber se é tutor, então a página não abre
                    <main className={styles.conteudo}>
                        <ErroCarregamento mensagem={getErrorMessage(tutorias.erro)} status={getErrorStatus(tutorias.erro)} />
                    </main>
                ) : children}
            </ProvedorContadores>
        </AreaComRodape>
    )
}
