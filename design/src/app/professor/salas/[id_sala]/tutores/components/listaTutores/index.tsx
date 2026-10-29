"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { TutorSala } from '@/lib/types'
import { formatarData } from '@/lib/formatacao'
import { useAcao } from '@/lib/useAcao'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { Avatar } from '@/components/avatar'
import { EmptyState } from '@/components/emptyState'
import { ConfirmDialog } from '@/components/confirmDialog'
import { Botao } from '@/components/botao'
import { Etiqueta } from '@/components/etiqueta'
import { handleRevogarTutor } from '@/app/professor/actions'
import { ModalAvaliacao } from '../modalAvaliacao'

interface Props {
    tutores: TutorSala[];
}

// Permissões do Figma (p07) que não têm rota na API: aparecem desabilitadas (decisão D4).
// "Criar atividades" tem rota (P29) e fica no topo da sala, valendo para todos os tutores
const PERMISSOES_SEM_ROTA = ["Vincular materiais", "Modelo de correção"]

// Lista dos tutores ativos com "Avaliar" (P9/P10) e "Remover" (P8).
// No Figma o "Remover?" é um checkbox; aqui é um botão por tutor, porque checkbox sugere
// seleção e não uma ação, e remover pede confirmação.
export function ListaTutores({ tutores }: Props){
    const [remover, setRemover] = useState<TutorSala | null>(null);
    const [avaliar, setAvaliar] = useState<TutorSala | null>(null);
    const { pendente, executar } = useAcao();

    return (
        <div className={lista.tela}>
            <Card titulo={`Tutores (${tutores.length})`} sublinhado>
                {tutores.length === 0 ? (
                    <EmptyState mensagem={`A sala ainda não tem tutores. Os tutores entram quando você aceita um pedido na aba "Pedidos".`} />
                ) : (
                    <ul className={lista.lista}>
                        {tutores.map((tutor) => (
                            <li key={tutor.id_tutor_sala}>
                                <ListItem inicio={<Avatar nome={tutor.aluno.nome} />}>
                                    <div className={styles.linha}>
                                        <div>
                                            <span className={lista.nome}>{tutor.aluno.nome}</span>
                                            <span className={lista.detalhe}>
                                                {tutor.aluno.email} · tutor desde {formatarData(tutor.data_definicao)}
                                            </span>
                                            <span className={lista.etiquetas}>
                                                <Etiqueta cor={tutor.pode_criar_ativ ? "sucesso" : "neutro"}>
                                                    {tutor.pode_criar_ativ ? "Pode criar atividades" : "Não cria atividades"}
                                                </Etiqueta>
                                            </span>
                                        </div>

                                        <div className={lista.acoes}>
                                            <Botao pequeno variante="secundario" onClick={() => setAvaliar(tutor)}>Avaliar</Botao>
                                            <Botao pequeno variante="perigo" onClick={() => setRemover(tutor)}>Remover</Botao>
                                        </div>
                                    </div>
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card titulo="Outras permissões dos tutores" sublinhado>
                <p className={lista.ajuda}>
                    A permissão de criar atividades fica no topo da sala e vale para todos os tutores.
                </p>
                <ul className={lista.lista}>
                    {PERMISSOES_SEM_ROTA.map((permissao) => (
                        <li key={permissao} aria-disabled="true" className={styles.desabilitado}>
                            <ListItem direita={<Etiqueta>Em breve</Etiqueta>}>{permissao}</ListItem>
                        </li>
                    ))}
                </ul>
            </Card>

            <ConfirmDialog
            aberto={remover !== null}
            titulo="Remover tutor da sala"
            mensagem={
                <>
                    Remover <strong>{remover?.aluno.nome}</strong> da tutoria desta sala? As tutorias ativas
                    dele serão finalizadas. O histórico deste tutor não passa para um novo tutor.
                </>
            }
            textoConfirmar="Remover tutor"
            pendente={pendente}
            onConfirmar={() => remover && executar(() => handleRevogarTutor(remover.id_tutor_sala), () => setRemover(null))}
            onFechar={() => setRemover(null)}
            />

            <ModalAvaliacao tutor={avaliar} onFechar={() => setAvaliar(null)} />
        </div>
    )
}
