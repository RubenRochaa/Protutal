"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { Send } from 'lucide-react'
import { Aviso } from '@/lib/types'
import { formatarDataHora } from '@/lib/formatacao'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { Botao } from '@/components/botao'
import { ModalAviso } from '@/app/professor/components/modalAviso'

interface Props {
    idSala: number;
    avisos: Aviso[];
}

// Avisos publicados (a A4 já devolve do mais recente para o mais antigo) ao lado do
// cartão "Enviar aviso para a sala", como na p03. Os alunos leem os avisos na área deles.
export function ListaAvisos({ idSala, avisos }: Props){
    const [modalAberto, setModalAberto] = useState(false);

    return (
        <div className={styles.grade}>
            <Card titulo={`Avisos publicados (${avisos.length})`} sublinhado>
                {avisos.length === 0 ? (
                    <EmptyState mensagem={`Nenhum aviso publicado nesta sala. Use "Enviar aviso" para mandar o primeiro.`} />
                ) : (
                    <ul className={lista.lista}>
                        {avisos.map((aviso) => (
                            <li key={aviso.id_aviso}>
                                <ListItem>
                                    <span className={lista.nome}>{aviso.titulo}</span>
                                    <span className={lista.detalhe}>
                                        {formatarDataHora(aviso.data_publicacao)} · {aviso.professor.nome}
                                    </span>
                                    <span className={lista.texto}>{aviso.conteudo}</span>
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card titulo="Enviar aviso para a sala" sublinhado className={styles.cartaoEnviar}>
                <p className={lista.ajuda}>
                    O aviso aparece para todos os alunos matriculados nesta sala.
                </p>
                <Botao onClick={() => setModalAberto(true)}>
                    <Send size={18} aria-hidden="true" />
                    Enviar aviso
                </Botao>
            </Card>

            <ModalAviso aberto={modalAberto} onFechar={() => setModalAberto(false)} idSala={idSala} />
        </div>
    )
}
