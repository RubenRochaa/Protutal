import pagina from '../page.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { Sala } from '@/lib/types'
import { PageBanner } from '@/components/pageBanner'
import { ErroCarregamento } from '../components/erroCarregamento'
import { SalasPorAno } from '../components/salasPorAno'

// Menu "Desempenho" (Figma p14). As rotas de desempenho são por sala (P13 e P14),
// então aqui o professor escolhe a sala (P20) e vai para a aba Desempenho dela.
export default async function DesempenhoPage(){
    const resultado = await getAutenticado<Sala[]>("/salas")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    return (
        <main>
            <PageBanner titulo="Desempenhos" />

            <div className={pagina.conteudo}>
                <p className={lista.ajuda}>Escolha a sala para ver o desempenho dos tutorados e dos tutores.</p>

                {"erro" in resultado ? (
                    <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
                ) : (
                    <SalasPorAno
                    salas={resultado.dados}
                    aba="desempenho"
                    mensagemVazia={`Você ainda não tem salas. Crie uma sala no menu "Salas".`}
                    />
                )}
            </div>
        </main>
    )
}
