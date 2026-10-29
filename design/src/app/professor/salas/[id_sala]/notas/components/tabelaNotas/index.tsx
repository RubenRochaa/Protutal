import styles from './styles.module.scss'
import { NotaSala } from '@/lib/types'
import { formatarData, formatarNota } from '@/lib/formatacao'
import { Etiqueta } from '@/components/etiqueta'

interface Props {
    notas: NotaSala[];
}

// Tabela de notas (P14), na ordem da API: aluno -> etapa -> prazo.
// No celular a tabela rola de lado dentro do próprio quadro (a página não rola).
export function TabelaNotas({ notas }: Props){
    return (
        <div className={styles.quadro}>
            <table className={styles.tabela}>
                <thead>
                    <tr>
                        <th scope="col">Aluno</th>
                        <th scope="col">Atividade</th>
                        <th scope="col">Etapa</th>
                        <th scope="col">Conteúdo</th>
                        <th scope="col">Tutor</th>
                        <th scope="col">Lançada em</th>
                        <th scope="col" className={styles.numero}>Nota</th>
                    </tr>
                </thead>
                <tbody>
                    {notas.map((nota) => (
                        <tr key={nota.id_nota}>
                            <td>{nota.aluno.nome}</td>
                            <td>{nota.atividade.titulo}</td>
                            <td>{nota.atividade.etapa}ª</td>
                            <td>{nota.conteudo?.nome ?? "—"}</td>
                            <td>{nota.tutor.nome}</td>
                            <td>{formatarData(nota.data_lancamento)}</td>
                            <td className={styles.numero}>
                                <strong>{formatarNota(nota.valor)}</strong>
                                {nota.contestacao_pendente && (
                                    <span className={styles.contestada}><Etiqueta cor="destaque">Contestada</Etiqueta></span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
