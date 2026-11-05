import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { TutoriaAluno } from '@/lib/types'
import { ToastErro } from '../toastErro'

const TITULO = "Minha tutoria"

// Card "Minha tutoria": tutor e sala das tutorias ativas do aluno (rota A3).
// A API não tem foto de usuário, então o card mostra só os nomes
export async function CardTutoria(){
    const resultado = await getAutenticado<TutoriaAluno[]>("/alunos/me/tutorias", { status: "ativa" })

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO}><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    if(resultado.dados.length === 0){
        return <Card titulo={TITULO}><EmptyState mensagem="Você ainda não tem tutoria ativa." /></Card>
    }

    return (
        <Card titulo={TITULO}>
            {resultado.dados.map((tutoria) => (
                <div key={tutoria.id_tutoria} className={styles.quadro}>
                    <p className={styles.rotulo}>Tutor:</p>
                    <p className={styles.nome}>{tutoria.tutor.nome}</p>
                    <p className={styles.sala}>Sala {tutoria.sala.nome}</p>
                </div>
            ))}
        </Card>
    )
}
