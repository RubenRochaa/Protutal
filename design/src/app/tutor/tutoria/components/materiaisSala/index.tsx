import styles from './styles.module.scss'
import pagina from '../../../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { Download } from 'lucide-react'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData } from '@/lib/formatacao'
import { MaterialSala } from '@/lib/types'
import { ErroCarregamento } from '@/app/professor/components/erroCarregamento'
import { buscarTutorias, salasDasTutorias } from '../../../buscas'
import { FormMaterial } from '../formMaterial'

const TITULO = "Anexar materiais"

// Coluna direita do print 2 (antiga tela "Materiais"): formulário de envio (T5)
// e a lista dos materiais de cada sala em que o tutor tem tutorias (A5)
export async function MateriaisSala(){
    // T1 sem filtro: todas as salas, com ou sem tutoria ativa
    const tutorias = await buscarTutorias("")

    if("erro" in tutorias){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(tutorias.erro)

        return (
            <Card titulo={TITULO} sublinhado>
                <ErroCarregamento mensagem={getErrorMessage(tutorias.erro)} status={getErrorStatus(tutorias.erro)} />
            </Card>
        )
    }

    const salas = salasDasTutorias(tutorias.dados)

    if(salas.length === 0){
        return (
            <Card titulo={TITULO} sublinhado>
                <EmptyState mensagem="Você ainda não tem tutorados. O professor da sala cria as tutorias." />
            </Card>
        )
    }

    const materiais = await Promise.all(
        salas.map((sala) => getAutenticado<MaterialSala[]>(`/salas/${sala.id_sala}/materiais`))
    )

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    for(const resultado of materiais){
        if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)
    }

    // A T5 exige pelo menos uma tutoria ativa na sala
    const salasComAtiva = salas.filter((sala) => sala.temAtiva)

    return (
        <Card titulo={TITULO} sublinhado>
            {salasComAtiva.length > 0 ? (
                <FormMaterial salas={salasComAtiva.map((s) => ({ valor: String(s.id_sala), rotulo: `Sala ${s.nome}` }))} />
            ) : (
                <p className={pagina.aviso}>Para anexar material, você precisa ter pelo menos uma tutoria ativa na sala.</p>
            )}

            {salas.map((sala, i) => {
                const resultado = materiais[i]

                return (
                    <section key={sala.id_sala} className={styles.sala} aria-label={`Materiais da sala ${sala.nome}`}>
                        <h3 className={styles.nomeSala}>Materiais · Sala {sala.nome}</h3>

                        {"erro" in resultado ? (
                            <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
                        ) : resultado.dados.length === 0 ? (
                            <EmptyState mensagem="Você ainda não anexou materiais nesta sala." />
                        ) : (
                            <ul className={lista.lista}>
                                {resultado.dados.map((material) => (
                                    <li key={material.id_material}>
                                        <ListItem
                                        direita={
                                            <a
                                            href={material.arquivo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.download}
                                            aria-label={`Abrir arquivo do material ${material.titulo}`}
                                            >
                                                <Download size={22} aria-hidden="true" />
                                            </a>
                                        }
                                        >
                                            <span className={lista.nome}>{material.titulo}</span>
                                            {material.descricao && <span className={lista.texto}>{material.descricao}</span>}
                                            {/* A A5 junta os materiais de outros tutores se o aluno também for tutorado na sala */}
                                            <span className={lista.detalhe}>
                                                Anexado por {material.tutor.nome} em {formatarData(material.data_envio)}
                                            </span>
                                        </ListItem>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )
            })}
        </Card>
    )
}
