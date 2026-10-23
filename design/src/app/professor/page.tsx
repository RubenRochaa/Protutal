import styles from './styles.module.scss'
import Link from 'next/link'
import { api } from '@/services/api'
import { getAuthHeaders } from '@/lib/sessao'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { Sala } from '@/lib/types'
import { PageBanner } from '@/components/pageBanner'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { ErrorState } from '@/components/errorState'
import { SessaoExpirada } from '@/components/sessaoExpirada'
import { NovaTurma } from './components/novaTurma'

// Página inicial do professor: as turmas (salas) dele.
// Roda no servidor: busca GET /salas com o token do cookie.
export default async function ProfessorPage(){
    let salas: Sala[] = [];
    let erro: string | null = null;

    try {
        const response = await api.get<Sala[]>("/salas", { headers: await getAuthHeaders() })
        salas = response.data
    } catch(err) {
        // Token vencido ou inválido: o componente apaga a sessão e volta ao login
        if(getErrorStatus(err) === 401) return <SessaoExpirada />;

        erro = getErrorMessage(err)
    }

    return (
        <>
            <PageBanner titulo="Turmas" />

            <main className={styles.main}>
                {erro ? (
                    <Card>
                        <ErrorState mensagem={erro} />
                    </Card>
                ) : (
                    <>
                        <div className={styles.topo}>
                            <NovaTurma />
                        </div>

                        {salas.length === 0 ? (
                            <Card>
                                <EmptyState mensagem="Você ainda não tem turmas. Clique em Nova turma para começar." />
                            </Card>
                        ) : (
                            <div className={styles.grade}>
                                {salas.map((sala) => (
                                    <Card key={sala.id_sala}>
                                        <div className={styles.turma}>
                                            <div className={styles.info}>
                                                <h2 className={styles.nome}>{sala.nome}</h2>
                                                <p className={styles.detalhe}>
                                                    {sala.serie}ª série · {sala.ano_letivo}
                                                </p>
                                            </div>

                                            {/* Detalhe da sala: próxima tela, ainda não existe */}
                                            <Link href={`/professor/salas/${sala.id_sala}`} className={styles.link}>
                                                <ListItem>Ver tutores e tutorados</ListItem>
                                            </Link>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </>
    )
}
