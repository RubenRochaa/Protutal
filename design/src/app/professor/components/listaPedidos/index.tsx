"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { PedidoTutoria } from '@/lib/types'
import { formatarData } from '@/lib/formatacao'
import { useAcao } from '@/lib/useAcao'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { Avatar } from '@/components/avatar'
import { EmptyState } from '@/components/emptyState'
import { Modal } from '@/components/modal'
import { ConfirmDialog } from '@/components/confirmDialog'
import { Botao } from '@/components/botao'
import { handleAceitarPedido, handleRecusarPedido } from '../../actions'

interface Props {
    pedidos: PedidoTutoria[];
    // Na tela Notificações aparecem pedidos de várias salas: mostra o nome da sala
    mostrarSala?: boolean;
    mensagemVazia: string;
}

// Pedidos pendentes para ser tutor (Figma p08, lista) e o modal de decisão (p05).
// Aceitar (P27) cria o tutor na sala; recusar (P28) pede confirmação antes.
// Depois da ação a lista é buscada de novo e o pedido sai dos pendentes.
export function ListaPedidos({ pedidos, mostrarSala = false, mensagemVazia }: Props){
    const [aberto, setAberto] = useState<PedidoTutoria | null>(null);
    const [confirmarRecusa, setConfirmarRecusa] = useState(false);
    const { pendente, executar } = useAcao();

    function fechar(){
        setConfirmarRecusa(false);
        setAberto(null);
    }

    return (
        <Card titulo={`Pedidos para ser tutor (${pedidos.length})`} sublinhado>
            {pedidos.length === 0 ? (
                <EmptyState mensagem={mensagemVazia} />
            ) : (
                <ul className={lista.lista}>
                    {pedidos.map((pedido) => (
                        <li key={pedido.id_pedido}>
                            <ListItem
                            inicio={<Avatar nome={pedido.aluno.nome} />}
                            direita={<Botao pequeno onClick={() => setAberto(pedido)}>Ver pedido</Botao>}
                            >
                                <span className={lista.nome}>{pedido.aluno.nome} quer ser tutor</span>
                                <span className={lista.detalhe}>
                                    {mostrarSala && `${pedido.sala_pedido.nome} · `}
                                    Pedido em {formatarData(pedido.data_solicitacao)}
                                </span>
                            </ListItem>
                        </li>
                    ))}
                </ul>
            )}

            {/* p05: "Pedido para se tornar tutor de: (nome)" com Aceitar e Recusar */}
            <Modal
            aberto={aberto !== null && !confirmarRecusa}
            onFechar={fechar}
            titulo={`Pedido para se tornar tutor de: ${aberto?.aluno.nome ?? ""}`}
            acoes={aberto && (
                <>
                    <Botao variante="secundario" disabled={pendente} onClick={() => setConfirmarRecusa(true)}>
                        Recusar
                    </Botao>
                    <Botao
                    carregando={pendente}
                    onClick={() => executar(() => handleAceitarPedido(aberto.id_pedido, aberto.sala_pedido.id_sala), fechar)}
                    >
                        {pendente ? "Enviando..." : "Aceitar"}
                    </Botao>
                </>
            )}
            >
                {aberto && (
                    <dl className={styles.dados}>
                        <div>
                            <dt>Sala do pedido</dt>
                            <dd>{aberto.sala_pedido.nome}</dd>
                        </div>
                        <div>
                            <dt>Data do pedido</dt>
                            <dd>{formatarData(aberto.data_solicitacao)}</dd>
                        </div>
                        <div>
                            <dt>Salas suas em que o aluno está matriculado</dt>
                            <dd>{aberto.salas_matriculado.map((s) => s.nome).join(", ") || "Nenhuma"}</dd>
                        </div>
                    </dl>
                )}
                <p className={lista.detalhe}>
                    Ao aceitar, o aluno vira tutor desta sala, ainda sem permissão para criar atividades.
                </p>
            </Modal>

            <ConfirmDialog
            aberto={confirmarRecusa}
            titulo="Recusar pedido"
            mensagem={`Recusar o pedido de ${aberto?.aluno.nome ?? ""} para ser tutor? O pedido sai da lista e não pode ser aceito depois.`}
            textoConfirmar="Recusar pedido"
            pendente={pendente}
            onConfirmar={() => aberto && executar(() => handleRecusarPedido(aberto.id_pedido), fechar)}
            onFechar={() => setConfirmarRecusa(false)}
            />
        </Card>
    )
}
