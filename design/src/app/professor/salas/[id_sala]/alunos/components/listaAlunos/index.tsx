"use client"

import styles from './styles.module.scss'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { AlunoSala } from '@/lib/types'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { Avatar } from '@/components/avatar'
import { EmptyState } from '@/components/emptyState'
import { Botao } from '@/components/botao'
import { ModalMatricula } from '../modalMatricula'

interface Props {
    idSala: number;
    alunos: AlunoSala[];
}

// Lista dos alunos matriculados (P23) e os botões da p06.
// "tornar tutor?" do Figma não existe aqui: não há rota para o professor tornar um aluno tutor (só o aceite do pedido, P27)
export function ListaAlunos({ idSala, alunos }: Props){
    const [modalAberto, setModalAberto] = useState(false);

    // Ids já matriculados: o modal mostra "Já matriculado" nesses alunos
    const matriculados = alunos.map((aluno) => aluno.id_aluno);

    return (
        <div className={styles.container}>
            <Card titulo={`Alunos (${alunos.length})`} sublinhado>
                {alunos.length === 0 ? (
                    <EmptyState mensagem={`Nenhum aluno matriculado nesta sala. Clique em "Adicionar alunos" para matricular.`} />
                ) : (
                    <ul className={styles.lista}>
                        {alunos.map((aluno) => (
                            <li key={aluno.id_aluno}>
                                <ListItem inicio={<Avatar nome={aluno.nome} />}>
                                    <span className={styles.nome}>{aluno.nome}</span>
                                    <span className={styles.email}>{aluno.email}</span>
                                    {!aluno.email_confirmado && (
                                        <span className={styles.etiqueta}>e-mail não confirmado</span>
                                    )}
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <div className={styles.botoes}>
                {/* "Ver atividades" da p06 leva à aba Atividades */}
                <Botao variante="secundario" href={`/professor/salas/${idSala}/atividades`}>
                    Ver atividades
                </Botao>

                <button type="button" className={styles.botao} onClick={() => setModalAberto(true)}>
                    <UserPlus size={20} aria-hidden="true" />
                    Adicionar alunos
                </button>
            </div>

            <ModalMatricula
            idSala={idSala}
            aberto={modalAberto}
            matriculados={matriculados}
            onFechar={() => setModalAberto(false)}
            />
        </div>
    )
}
