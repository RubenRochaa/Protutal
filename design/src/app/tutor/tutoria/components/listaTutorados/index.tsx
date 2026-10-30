import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { MessageCircle, Plus } from 'lucide-react'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { Avatar } from '@/components/avatar'
import { Botao } from '@/components/botao'
import { Etiqueta } from '@/components/etiqueta'
import { EmptyState } from '@/components/emptyState'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData } from '@/lib/formatacao'
import { TutoriaTutor } from '@/lib/types'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { buscarTutorias } from '../../../buscas'

const TITULO = "Converse com os seus tutorados"

interface Props {
    // Valor da T1 ("ativa", "finalizada" ou "" = todas)
    status: string;
}

// Texto da lista vazia para cada filtro
const VAZIO: Record<string, string> = {
    ativa: "Nenhuma tutoria ativa no momento. O professor da sala cria as tutorias.",
    finalizada: "Nenhuma tutoria finalizada.",
    "": "Você ainda não tem tutorados. O professor da sala cria as tutorias.",
}

// Agrupa as tutorias por sala, mantendo a ordem da T1 (data de início)
function porSala(tutorias: TutoriaTutor[]){
    const grupos = new Map<number, { nome: string; tutorias: TutoriaTutor[] }>()

    for(const tutoria of tutorias){
        const grupo = grupos.get(tutoria.sala.id_sala) ?? { nome: tutoria.sala.nome, tutorias: [] }
        grupo.tutorias.push(tutoria)
        grupos.set(tutoria.sala.id_sala, grupo)
    }

    return [...grupos.entries()]
}

// Coluna esquerda do print 2: cada tutorado com a data de início e o acesso ao chat (rota T1)
export async function ListaTutorados({ status }: Props){
    const resultado = await buscarTutorias(status)

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return (
            <Card titulo={TITULO} sublinhado>
                <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
            </Card>
        )
    }

    if(resultado.dados.length === 0){
        return (
            <Card titulo={TITULO} sublinhado>
                <EmptyState mensagem={VAZIO[status] ?? VAZIO[""]} />
            </Card>
        )
    }

    return (
        <Card titulo={TITULO} sublinhado>
            {porSala(resultado.dados).map(([idSala, grupo]) => (
                <section key={idSala} className={styles.sala} aria-label={`Sala ${grupo.nome}`}>
                    <h3 className={styles.nomeSala}>Sala {grupo.nome}</h3>

                    <ul className={lista.lista}>
                        {grupo.tutorias.map((tutoria) => {
                            const ativa = tutoria.status === "ativa"

                            return (
                                <li key={tutoria.id_tutoria}>
                                    <ListItem inicio={<Avatar nome={tutoria.aluno.nome} />}>
                                        <span className={lista.nome}>{tutoria.aluno.nome}</span>
                                        <span className={lista.detalhe}>
                                            <strong>Data de início:</strong> {formatarData(tutoria.data_inicio)}
                                            {tutoria.data_fim && ` · Fim: ${formatarData(tutoria.data_fim)}`}
                                        </span>
                                        <span className={lista.texto}>
                                            {tutoria.meta_aprendizagem ?? "Sem meta definida"}
                                        </span>
                                        <span className={lista.etiquetas}>
                                            <Etiqueta cor={ativa ? "sucesso" : "neutro"}>{ativa ? "Ativa" : "Finalizada"}</Etiqueta>
                                        </span>

                                        <span className={styles.acoes}>
                                            <Botao pequeno href={`/tutor/tutorias/${tutoria.id_tutoria}/chat`}>
                                                <MessageCircle size={16} aria-hidden="true" /> Abrir chat
                                            </Botao>
                                            {ativa && (
                                                <Botao pequeno variante="secundario" href={`/tutor/atividades/nova?tutoria=${tutoria.id_tutoria}`}>
                                                    <Plus size={16} aria-hidden="true" /> Nova atividade
                                                </Botao>
                                            )}
                                        </span>
                                    </ListItem>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}
        </Card>
    )
}
