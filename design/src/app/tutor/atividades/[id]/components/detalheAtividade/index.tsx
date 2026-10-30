import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { Card } from '@/components/card'
import { Avatar } from '@/components/avatar'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData, formatarDataHora, rotuloTipo } from '@/lib/formatacao'
import { AtividadeDetalhe, RespostasAtividade } from '@/lib/types'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { buscarTipos } from '../../../../buscas'
import { AlunosAtividade } from '../alunosAtividade'

// Respostas da A2 que significam "esta atividade não pode ser aberta":
// 400 (id inválido), 403 (não é o tutor criador com vínculo ativo) e 404 (não existe)
const INDISPONIVEL = [400, 403, 404]

interface Props {
    // Vem da URL sem tratar (ex.: "abc"): quem valida é a API (400)
    id: string;
}

function Indisponivel(){
    return (
        <Card>
            <EmptyState
            mensagem="Atividade não encontrada ou você não tem acesso a ela."
            acao={<Link href="/tutor/atividades" className={lista.voltar}>Ir para Atividades</Link>}
            />
        </Card>
    )
}

// Busca a atividade (A2), as respostas e notas (P12) e os rótulos dos tipos (T8) ao mesmo tempo.
// Layout do print 6: atividade e alunos à esquerda; tutor e prazo à direita.
// "Data de criação" e "Anexo" do print não aparecem: a API não tem esses dados
export async function DetalheAtividade({ id }: Props){
    const idUrl = encodeURIComponent(id)

    const [resultado, respostas, tipos] = await Promise.all([
        getAutenticado<AtividadeDetalhe>(`/atividades/${idUrl}`),
        getAutenticado<RespostasAtividade>(`/atividades/${idUrl}/respostas`),
        buscarTipos()
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)
    if("erro" in respostas) sessaoExpiradaNaPagina(respostas.erro)

    if("erro" in resultado){
        const status = getErrorStatus(resultado.erro)
        if(status !== null && INDISPONIVEL.includes(status)) return <Indisponivel />;

        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={status} />
    }

    // Visão do aluno destinatário: não é uma atividade que este tutor criou
    if(resultado.dados.perfil !== "tutor") return <Indisponivel />;

    const atividade = resultado.dados
    const rotulos = "dados" in tipos ? tipos.dados : []

    // Roda no servidor, a cada busca: o prazo vencido libera a nota de quem não entregou
    const prazoVencido = new Date(atividade.data_entrega) < new Date()

    const detalhe = [
        atividade.conteudo?.nome,
        `${atividade.etapa}ª etapa`,
        rotuloTipo(atividade.tipo, rotulos)
    ].filter(Boolean).join(" · ")

    return (
        // A atividade vem primeiro no HTML: no celular e no tablet fica em cima
        <div className={styles.grade}>
            <Card className={styles.esquerda}>
                <h2 className={styles.titulo}>
                    <span className={styles.rotulo}>Atividade:</span> {atividade.titulo}
                </h2>
                <p className={lista.detalhe}>{detalhe} · Sala {atividade.sala.nome}</p>
                {atividade.descricao && <p className={lista.texto}>{atividade.descricao}</p>}

                {"erro" in respostas ? (
                    <ErroCarregamento mensagem={getErrorMessage(respostas.erro)} status={getErrorStatus(respostas.erro)} />
                ) : (
                    <AlunosAtividade
                    idAtividade={atividade.id_atividade}
                    alunos={respostas.dados.alunos}
                    prazoVencido={prazoVencido}
                    prazo={formatarData(atividade.data_entrega)}
                    />
                )}
            </Card>

            <Card className={styles.direita}>
                <h2 className={styles.rotulo}>Tutor que enviou</h2>
                <div className={styles.quadro}>
                    <Avatar nome={atividade.tutor.nome} tamanho="grande" />
                    <span className={styles.nomeTutor}>{atividade.tutor.nome}</span>
                </div>

                <h3 className={styles.rotuloMenor}>Prazo de entrega</h3>
                <div className={styles.quadro}>
                    <span>{formatarDataHora(atividade.data_entrega)}</span>
                    {prazoVencido && <span className={lista.detalhe}>Prazo encerrado</span>}
                </div>
            </Card>
        </div>
    )
}
