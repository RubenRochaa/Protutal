import pagina from '../page.module.scss'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { Sala } from '@/lib/types'
import { PageBanner } from '@/components/pageBanner'
import { ErroCarregamento } from '../components/erroCarregamento'
import { FormExportar } from './components/formExportar'

// "Exportar notas" (Figma p16). A P15 exporta as notas de UMA sala, com filtro opcional de etapa:
// "ano" e "turma" do Figma viraram um único select de sala (P20) e "trimestre" virou "etapa".
export default async function ExportarNotasPage(){
    const resultado = await getAutenticado<Sala[]>("/salas")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    return (
        <main>
            <PageBanner titulo="Exportar notas" />

            <div className={pagina.conteudo}>
                {"erro" in resultado
                    ? <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
                    : <FormExportar salas={resultado.dados} />
                }
            </div>
        </main>
    )
}
