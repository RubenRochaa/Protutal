"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { Download } from 'lucide-react'
import { RespostasAtividade } from '@/lib/types'
import { formatarDataHora, formatarNota } from '@/lib/formatacao'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { Avatar } from '@/components/avatar'
import { EmptyState } from '@/components/emptyState'
import { Modal } from '@/components/modal'
import { Botao } from '@/components/botao'
import { Etiqueta } from '@/components/etiqueta'
import { MASCOTES } from '@/lib/mascotes'

type Destinatario = RespostasAtividade["alunos"][number]

interface Props {
    alunos: Destinatario[];
}

const STATUS = {
    pendente: "Não enviou",
    entregue: "Entregue",
    entregue_com_atraso: "Entregue com atraso",
}

// Duas colunas como na p04: quem enviou (com "Ver envio") e quem ainda não enviou.
// O arquivo enviado é uma URL pública do Cloudinary: o download abre direto, sem token.
export function RespostasAlunos({ alunos }: Props){
    const [aberto, setAberto] = useState<Destinatario | null>(null);

    const enviaram = alunos.filter((a) => a.resposta !== null)
    const naoEnviaram = alunos.filter((a) => a.resposta === null)

    function nota(destinatario: Destinatario){
        return destinatario.nota ? formatarNota(destinatario.nota.valor) : "Sem nota"
    }

    return (
        <div className={lista.duasColunas}>
            <Card titulo={`Alunos que enviaram (${enviaram.length})`} sublinhado>
                {enviaram.length === 0 ? (
                    <EmptyState mensagem="Nenhum aluno enviou esta atividade ainda." imagem={MASCOTES.atividades} />
                ) : (
                    <ul className={lista.lista}>
                        {enviaram.map((d) => (
                            <li key={d.aluno.id_aluno}>
                                <ListItem
                                inicio={<Avatar nome={d.aluno.nome} />}
                                direita={<Botao pequeno variante="secundario" onClick={() => setAberto(d)}>Ver envio</Botao>}
                                >
                                    <span className={lista.nome}>{d.aluno.nome}</span>
                                    <span className={lista.detalhe}>Nota: {nota(d)}</span>
                                    <span className={lista.etiquetas}>
                                        <Etiqueta cor={d.status === "entregue" ? "sucesso" : "neutro"}>{STATUS[d.status]}</Etiqueta>
                                    </span>
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card titulo={`Ainda não enviaram (${naoEnviaram.length})`} sublinhado>
                {naoEnviaram.length === 0 ? (
                    <EmptyState mensagem="Todos os alunos enviaram." imagem={MASCOTES.atividades} />
                ) : (
                    <ul className={lista.lista}>
                        {naoEnviaram.map((d) => (
                            <li key={d.aluno.id_aluno}>
                                <ListItem inicio={<Avatar nome={d.aluno.nome} />}>
                                    <span className={lista.nome}>{d.aluno.nome}</span>
                                    {/* Depois do prazo o tutor pode lançar nota mesmo sem entrega */}
                                    <span className={lista.detalhe}>Nota: {nota(d)}</span>
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {/* p01: "Envio do aluno" */}
            <Modal aberto={aberto !== null} onFechar={() => setAberto(null)} titulo="Envio do aluno">
                {aberto?.resposta && (
                    <dl className={styles.dados}>
                        <div>
                            <dt>Aluno</dt>
                            <dd>{aberto.aluno.nome}</dd>
                        </div>
                        <div>
                            <dt>Enviado em</dt>
                            <dd>{formatarDataHora(aberto.resposta.data_envio)} · {STATUS[aberto.status]}</dd>
                        </div>
                        {aberto.resposta.texto && (
                            <div>
                                <dt>Texto do aluno</dt>
                                <dd className={lista.texto}>{aberto.resposta.texto}</dd>
                            </div>
                        )}
                        <div>
                            <dt>Arquivo enviado</dt>
                            <dd>
                                <a href={aberto.resposta.conteudo_file} target="_blank" rel="noopener noreferrer" className={styles.download}>
                                    <Download size={18} aria-hidden="true" />
                                    Baixar arquivo
                                </a>
                            </dd>
                        </div>
                        <div>
                            <dt>Nota</dt>
                            <dd className={styles.nota}>{nota(aberto)}</dd>
                        </div>
                        {aberto.nota?.comentario && (
                            <div>
                                <dt>Comentário do tutor</dt>
                                <dd className={lista.texto}>{aberto.nota.comentario}</dd>
                            </div>
                        )}
                    </dl>
                )}
            </Modal>
        </div>
    )
}
