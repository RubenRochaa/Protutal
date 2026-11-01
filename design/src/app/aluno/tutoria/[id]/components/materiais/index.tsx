import styles from './styles.module.scss'
import { Download } from 'lucide-react'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { ListItem } from '@/components/listItem'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData } from '@/lib/formatacao'
import { MaterialSala } from '@/lib/types'
import { ToastErro } from '../../../../components/toastErro'
import { MASCOTES } from '@/lib/mascotes'

export const TITULO_MATERIAIS = "Materiais de apoio disponíveis"

interface Props {
    idSala: number;
}

// Bloco "Materiais de apoio disponíveis" (rota A5): materiais dos tutores do aluno na sala,
// do mais recente para o mais antigo. Cada item abre o arquivo em nova aba
export async function Materiais({ idSala }: Props){
    const resultado = await getAutenticado<MaterialSala[]>(`/salas/${idSala}/materiais`)

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        // 403: o aluno não tem acesso à sala. É um estado da tela, não falha: sem toast
        if(getErrorStatus(resultado.erro) === 403){
            return <Card titulo={TITULO_MATERIAIS} sublinhado><EmptyState mensagem="Você não tem acesso aos materiais desta sala." imagem={MASCOTES.badRequest} /></Card>
        }

        return <Card titulo={TITULO_MATERIAIS} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    if(resultado.dados.length === 0){
        return <Card titulo={TITULO_MATERIAIS} sublinhado><EmptyState mensagem="Nenhum material disponível." /></Card>
    }

    return (
        <Card titulo={TITULO_MATERIAIS} sublinhado>
            {resultado.dados.map((material) => (
                <ListItem
                key={material.id_material}
                direita={
                    <a
                    href={material.arquivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.baixar}
                    aria-label={`Baixar ${material.titulo} (abre em nova aba)`}
                    >
                        <Download size={28} aria-hidden="true" />
                    </a>
                }
                >
                    <p className={styles.titulo}>{material.titulo}</p>
                    {material.descricao && <p className={styles.descricao}>{material.descricao}</p>}
                    <p className={styles.info}>
                        Enviado por {material.tutor.nome} em {formatarData(material.data_envio)}
                    </p>
                </ListItem>
            ))}
        </Card>
    )
}
