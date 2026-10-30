import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { Plus } from 'lucide-react'
import { Card } from '@/components/card'
import { Botao } from '@/components/botao'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AtividadeTutor } from '@/lib/types'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { buscarTipos, filtros } from '../../../buscas'
import { ItemAtividade } from '../itemAtividade'

interface Props {
    // "" = sem filtro
    idSala: string;
    etapa: string;
}

interface ColunaProps {
    titulo: string;
    atividades: AtividadeTutor[];
    tipos: { valor: string; rotulo: string }[];
    vazio: string;
    className: string;
}

function Coluna({ titulo, atividades, tipos, vazio, className }: ColunaProps){
    return (
        <Card titulo={titulo} className={className}>
            {atividades.length === 0 ? (
                <EmptyState mensagem={vazio} />
            ) : (
                <ul className={lista.lista}>
                    {atividades.map((atividade) => (
                        <li key={atividade.id_atividade}>
                            <ItemAtividade atividade={atividade} tipos={tipos} />
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    )
}

// Busca as atividades do tutor (T2) e os rótulos dos tipos (T8) e separa em duas colunas.
// "Não corrigidas" = ainda falta nota para algum destinatário. A ordem da API é mantida
export async function ColunasAtividades({ idSala, etapa }: Props){
    const [resultado, tipos] = await Promise.all([
        getAutenticado<AtividadeTutor[]>("/tutores/me/atividades", filtros({ id_sala: idSala, etapa })),
        buscarTipos()
    ])

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    // Se a T8 falhar, o item mostra o valor técnico legível (rotuloTipo)
    const rotulos = "dados" in tipos ? tipos.dados : []
    const filtrado = idSala !== "" || etapa !== ""

    const naoCorrigidas = resultado.dados.filter((a) => a.total_com_nota < a.total_destinatarios)
    const corrigidas = resultado.dados.filter((a) => a.total_com_nota >= a.total_destinatarios)

    if(resultado.dados.length === 0){
        return (
            <Card>
                <EmptyState
                mensagem={filtrado ? "Nenhuma atividade com esses filtros." : "Você ainda não criou atividades."}
                acao={<Botao href="/tutor/atividades/nova"><Plus size={18} aria-hidden="true" /> Nova atividade</Botao>}
                />
            </Card>
        )
    }

    return (
        // "Não corrigidas" vem primeiro no HTML: no celular fica em cima, porque é o que falta fazer.
        // No desktop o CSS põe "Corrigidas" à esquerda, como no print
        <div className={styles.grade}>
            <Coluna
            titulo="Atividades não corrigidas"
            atividades={naoCorrigidas}
            tipos={rotulos}
            vazio="Nenhuma atividade esperando nota."
            className={styles.naoCorrigidas}
            />

            <Coluna
            titulo="Atividades corrigidas"
            atividades={corrigidas}
            tipos={rotulos}
            vazio="Nenhuma atividade com todas as notas lançadas."
            className={styles.corrigidas}
            />

            {/* 3ª coluna do print: atalho para criar atividade */}
            <Card className={styles.nova}>
                <Botao href="/tutor/atividades/nova" className={styles.botaoNova}>
                    <Plus size={22} aria-hidden="true" /> Nova atividade
                </Botao>
            </Card>
        </div>
    )
}
