"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { toast } from 'sonner'
import { Contestacao } from '@/lib/types'
import { formatarData, formatarNota } from '@/lib/formatacao'
import { textoVazio, validarNota } from '@/lib/validacao'
import { useAcao } from '@/lib/useAcao'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { Modal } from '@/components/modal'
import { ConfirmDialog } from '@/components/confirmDialog'
import { Input } from '@/components/input'
import { Textarea } from '@/components/textarea'
import { Botao } from '@/components/botao'
import { Etiqueta } from '@/components/etiqueta'
import { FiltroAbas } from '@/components/filtroAbas'
import { handleResolverContestacao } from '@/app/professor/actions'

interface Props {
    contestacoes: Contestacao[];
    filtro: string;
}

const OPCOES_FILTRO = [
    { valor: "", rotulo: "Todas" },
    { valor: "pendente", rotulo: "Pendentes" },
    { valor: "aceita", rotulo: "Aceitas" },
    { valor: "recusada", rotulo: "Recusadas" },
]

const ROTULO_STATUS = { pendente: "Pendente", aceita: "Aceita", recusada: "Recusada" }

// Lista das contestações da sala, o detalhe (com a justificativa do aluno) e a resolução (T4).
// Aceitar SUBSTITUI a nota pelo novo valor, e o valor anterior não fica guardado: o modal avisa isso.
export function ListaContestacoes({ contestacoes, filtro }: Props){
    const [detalhe, setDetalhe] = useState<Contestacao | null>(null);
    const [resolver, setResolver] = useState<Contestacao | null>(null);
    const [decisao, setDecisao] = useState<"aceita" | "recusada">("recusada");
    const [parecer, setParecer] = useState("");
    const [novaNota, setNovaNota] = useState("");
    const { pendente, executar } = useAcao();

    function abrirResolucao(contestacao: Contestacao){
        setDecisao("recusada");
        setParecer("");
        setNovaNota("");
        setDetalhe(null);
        setResolver(contestacao);
    }

    // Validação no navegador antes de chamar a API (as mesmas regras da T4)
    function confirmarResolucao(){
        if(!resolver) return;
        if(textoVazio(parecer)) return toast.error("O campo decisao é obrigatório");

        if(decisao === "aceita"){
            const nota = validarNota(novaNota, "valor");
            if("erro" in nota) return toast.error(nota.erro);
        }

        executar(
            () => handleResolverContestacao(resolver.id_contestacao, decisao, parecer, novaNota),
            () => setResolver(null)
        );
    }

    return (
        <div className={lista.tela}>
            <FiltroAbas parametro="status" opcoes={OPCOES_FILTRO} valor={filtro} rotulo="Filtrar contestações por situação" />

            <Card titulo={`Contestações (${contestacoes.length})`} sublinhado>
                {contestacoes.length === 0 ? (
                    <EmptyState mensagem={filtro
                        ? "Nenhuma contestação com essa situação."
                        : "Nenhum aluno contestou nota nesta sala."}
                    />
                ) : (
                    <ul className={lista.lista}>
                        {contestacoes.map((c) => (
                            <li key={c.id_contestacao}>
                                <ListItem
                                direita={<Botao pequeno variante="secundario" onClick={() => setDetalhe(c)}>Ver detalhe</Botao>}
                                >
                                    <span className={lista.nome}>{c.aluno.nome} · {c.atividade.titulo}</span>
                                    <span className={lista.detalhe}>
                                        Nota atual {formatarNota(c.nota.valor)} · {c.atividade.etapa}ª etapa · tutor {c.tutor.nome} · enviada em {formatarData(c.data_envio)}
                                    </span>
                                    <span className={lista.etiquetas}>
                                        <Etiqueta cor={c.status === "pendente" ? "destaque" : "neutro"}>{ROTULO_STATUS[c.status]}</Etiqueta>
                                    </span>
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Modal
            aberto={detalhe !== null}
            onFechar={() => setDetalhe(null)}
            titulo="Contestação de nota"
            acoes={detalhe?.status === "pendente" && (
                <Botao onClick={() => abrirResolucao(detalhe)}>Resolver</Botao>
            )}
            >
                {detalhe && (
                    <dl className={styles.dados}>
                        <div><dt>Aluno</dt><dd>{detalhe.aluno.nome}</dd></div>
                        <div>
                            <dt>Atividade</dt>
                            <dd>{detalhe.atividade.titulo} ({detalhe.atividade.conteudo?.nome ?? "sem conteúdo"}, {detalhe.atividade.etapa}ª etapa)</dd>
                        </div>
                        <div><dt>Nota atual</dt><dd>{formatarNota(detalhe.nota.valor)}</dd></div>
                        <div><dt>Justificativa do aluno</dt><dd className={lista.texto}>{detalhe.comentario}</dd></div>
                        <div><dt>Situação</dt><dd>{ROTULO_STATUS[detalhe.status]}</dd></div>
                        {detalhe.decisao && (
                            <div>
                                <dt>Decisão{detalhe.data_resolucao && ` (${formatarData(detalhe.data_resolucao)})`}</dt>
                                <dd className={lista.texto}>{detalhe.decisao}</dd>
                            </div>
                        )}
                    </dl>
                )}
            </Modal>

            <ConfirmDialog
            aberto={resolver !== null}
            titulo="Resolver contestação"
            mensagem={decisao === "aceita"
                ? `Ao aceitar, a nota atual (${resolver ? formatarNota(resolver.nota.valor) : ""}) será SUBSTITUÍDA pela nova nota. O valor anterior não fica guardado.`
                : "Ao recusar, a nota do aluno não muda."}
            textoConfirmar={decisao === "aceita" ? "Aceitar e substituir nota" : "Recusar contestação"}
            pendente={pendente}
            onConfirmar={confirmarResolucao}
            onFechar={() => setResolver(null)}
            >
                <fieldset className={styles.opcoes}>
                    <legend className={styles.legenda}>Decisão</legend>
                    <label>
                        <input type="radio" name="decisao" checked={decisao === "recusada"} onChange={() => setDecisao("recusada")} />
                        Recusar (mantém a nota)
                    </label>
                    <label>
                        <input type="radio" name="decisao" checked={decisao === "aceita"} onChange={() => setDecisao("aceita")} />
                        Aceitar (troca a nota)
                    </label>
                </fieldset>

                {decisao === "aceita" && (
                    <Input
                    label="Nova nota (0 a 10)"
                    name="contestacao_valor"
                    inputMode="decimal"
                    placeholder="Ex.: 9,5"
                    value={novaNota}
                    onChange={(e) => setNovaNota(e.target.value)}
                    />
                )}

                <Textarea
                label="Parecer (explique a decisão ao aluno)"
                name="contestacao_decisao"
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
                />
            </ConfirmDialog>
        </div>
    )
}
