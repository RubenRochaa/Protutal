import lista from '@/app/professor/lista.module.scss'
import styles from './page.module.scss'
import { Download } from 'lucide-react'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { MaterialSala, TutorSala } from '@/lib/types'
import { formatarData } from '@/lib/formatacao'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { FiltroSelect } from '@/components/filtroSelect'
import { ErroCarregamento } from '../../../components/erroCarregamento'

interface Props {
    params: Promise<{ id_sala: string }>;
    searchParams: Promise<{ id_tutor_sala?: string | string[] }>;
}

// Aba "Materiais" (sem Figma; padrão "Lista com filtro"). Só consulta: quem anexa é o tutor (T5).
// A5 (GET /salas/:id/materiais) devolve todos os materiais da sala para o professor.
// A A5 não aceita filtro, então o filtro por tutor é feito aqui, sobre a lista que ela devolveu.
// O select usa a P24, que só traz tutores ativos: material de tutor revogado aparece só em "Todos".
// O arquivo é uma URL pública do Cloudinary: o download abre direto, sem token.

// Materiais antigos (do seed) guardam um caminho local ("uploads/materiais/...") em vez da URL:
// como link, ele abriria uma página inexistente do front. Só vira link o que for http(s).
function ehLinkWeb(arquivo: string){
    return /^https?:\/\//i.test(arquivo)
}

export default async function MateriaisSalaPage({ params, searchParams }: Props){
    const { id_sala } = await params
    const busca = await searchParams
    const tutor = typeof busca.id_tutor_sala === "string" && /^[1-9]\d*$/.test(busca.id_tutor_sala) ? busca.id_tutor_sala : ""

    const [resultado, tutores] = await Promise.all([
        getAutenticado<MaterialSala[]>(`/salas/${encodeURIComponent(id_sala)}/materiais`),
        getAutenticado<TutorSala[]>(`/salas/${encodeURIComponent(id_sala)}/tutores`)
    ])

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
    }

    const materiais = tutor
        ? resultado.dados.filter((m) => String(m.tutor.id_tutor_sala) === tutor)
        : resultado.dados

    const opcoesTutor = "dados" in tutores
        ? [{ valor: "", rotulo: "Todos os tutores" }, ...tutores.dados.map((t) => ({ valor: String(t.id_tutor_sala), rotulo: t.aluno.nome }))]
        : null

    return (
        <div className={lista.tela}>
            <p className={lista.ajuda}>
                Materiais de apoio que os tutores anexaram para os tutorados desta sala.
            </p>

            {opcoesTutor && (
                <div className={lista.filtros}>
                    <FiltroSelect parametro="id_tutor_sala" label="Tutor" opcoes={opcoesTutor} valor={tutor} />
                </div>
            )}

            <Card titulo={`Materiais (${materiais.length})`} sublinhado>
                {materiais.length === 0 ? (
                    <EmptyState mensagem={tutor
                        ? "Nenhum material enviado por este tutor."
                        : "Nenhum material enviado pelos tutores desta sala."}
                    />
                ) : (
                    <ul className={lista.lista}>
                        {materiais.map((m) => (
                            <li key={m.id_material}>
                                <ListItem
                                direita={!ehLinkWeb(m.arquivo) ? (
                                    <span className={styles.indisponivel}>Arquivo indisponível</span>
                                ) : (
                                    <a
                                    href={m.arquivo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.baixar}
                                    aria-label={`Baixar o material ${m.titulo}`}
                                    >
                                        <Download size={16} aria-hidden="true" />
                                        Baixar
                                    </a>
                                )}
                                >
                                    <span className={lista.nome}>{m.titulo}</span>
                                    {m.descricao && <span className={lista.texto}>{m.descricao}</span>}
                                    <span className={lista.detalhe}>
                                        Enviado por {m.tutor.nome} em {formatarData(m.data_envio)}
                                    </span>
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    )
}
