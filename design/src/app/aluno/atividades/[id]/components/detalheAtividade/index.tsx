import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AtividadeDetalhe, TipoAtividadeOpcao } from '@/lib/types'
import { ToastErro } from '../../../../components/toastErro'
import { AtividadeIndisponivel } from '../atividadeIndisponivel'
import { CardAtividade } from '../cardAtividade'
import { CardCorrecao } from '../cardCorrecao'
import { CardResposta } from '../cardResposta'
import { FormResposta } from '../formResposta'

// Respostas da A2 que significam "esta atividade não pode ser aberta":
// 400 (id inválido), 403 (não é destinatário) e 404 (não existe)
const ATIVIDADE_INDISPONIVEL = [400, 403, 404]

interface Props {
    // Vem da URL sem tratar (ex.: "abc"): quem valida é a API (400)
    id: string;
}

// Sem a T8 (ou com um tipo novo que ela não conhece), mostra o valor técnico legível:
// "interpretacao_mapas" vira "Interpretacao mapas"
function rotuloDoTipo(tipo: string, tipos: TipoAtividadeOpcao[]): string {
    const encontrado = tipos.find((opcao) => opcao.valor === tipo)
    if(encontrado) return encontrado.rotulo;

    const texto = tipo.replaceAll("_", " ")

    return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Busca a atividade (A2) e os rótulos dos tipos (T8) ao mesmo tempo.
// À esquerda, os dados da atividade; à direita, o que o aluno pode fazer com ela
export async function DetalheAtividade({ id }: Props){
    const [resultado, resultadoTipos] = await Promise.all([
        getAutenticado<AtividadeDetalhe>(`/atividades/${encodeURIComponent(id)}`),
        getAutenticado<TipoAtividadeOpcao[]>("/tipos-atividade")
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        const status = getErrorStatus(resultado.erro)

        if(status !== null && ATIVIDADE_INDISPONIVEL.includes(status)) return <AtividadeIndisponivel />;

        // Sem conexão ou 500: toast e "Tentar novamente"
        return <ToastErro mensagem={getErrorMessage(resultado.erro)} />
    }

    // Visão do tutor criador: a tela dele é do lote B3
    if(resultado.dados.perfil !== "aluno") return <AtividadeIndisponivel />;

    const atividade = resultado.dados
    const tipos = "dados" in resultadoTipos ? resultadoTipos.dados : []

    // Roda no servidor, a cada busca: compara o prazo com a hora atual
    const vencida = new Date(atividade.data_entrega) < new Date()

    let direita: React.ReactNode

    if(atividade.resposta){
        direita = (
            <>
                <CardResposta resposta={atividade.resposta} status={atividade.status} />
                {atividade.nota && <CardCorrecao nota={atividade.nota} />}
            </>
        )
    } else if(atividade.pode_responder){
        direita = <FormResposta idAtividade={atividade.id_atividade} vencida={vencida} />
    } else {
        // Pendente de tutoria finalizada: a A14 recusaria o envio (403)
        direita = (
            <Card titulo="Envie sua resposta">
                <EmptyState mensagem="A tutoria desta atividade foi finalizada. Não é mais possível enviar resposta." />
            </Card>
        )
    }

    return (
        // A atividade vem primeiro no HTML: no celular e no tablet fica em cima
        <div className={styles.grade}>
            <CardAtividade
            atividade={atividade}
            tipo={rotuloDoTipo(atividade.tipo, tipos)}
            vencida={vencida}
            />

            <div className={styles.direita}>{direita}</div>
        </div>
    )
}
