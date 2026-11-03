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
import { ConfirmDialog } from '@/components/confirmDialog'
import { Input } from '@/components/input'
import { Textarea } from '@/components/textarea'
import { Botao } from '@/components/botao'
import { Etiqueta } from '@/components/etiqueta'
import { handleResolverContestacao } from '../../../actions'

interface Props {
    contestacoes: Contestacao[];
    // "" (pendentes), "resolvidas" ou "todas"
    filtro: string;
}

const ROTULO_STATUS = { pendente: "Pendente", aceita: "Aceita", recusada: "Recusada" }

const VAZIO: Record<string, string> = {
    "": "Nenhuma contestação pendente.",
    resolvidas: "Nenhuma contestação resolvida.",
    todas: "Nenhum aluno contestou nota nas suas atividades.",
}

// Lista das contestações das atividades do tutor, com os dados à vista (sem modal de detalhe).
// Pendente: "Aceitar" (nova nota + decisão) e "Recusar" (só decisão), rota T4.
// Aceitar SUBSTITUI a nota, e o valor anterior não fica guardado: a janela avisa isso
export function ListaContestacoes({ contestacoes, filtro }: Props){
    const [resolver, setResolver] = useState<{ contestacao: Contestacao; status: "aceita" | "recusada" } | null>(null);
    const [decisao, setDecisao] = useState("");
    const [novaNota, setNovaNota] = useState("");
    const { pendente, executar } = useAcao();

    function abrir(contestacao: Contestacao, status: "aceita" | "recusada"){
        setDecisao("");
        setNovaNota("");
        setResolver({ contestacao, status });
    }

    // Mesmas regras da T4 antes de chamar a API
    function confirmar(){
        if(!resolver) return;
        if(textoVazio(decisao)) return toast.error("O campo decisao é obrigatório");

        if(resolver.status === "aceita"){
            const nota = validarNota(novaNota, "valor");
            if("erro" in nota) return toast.error(nota.erro);
        }

        executar(
            () => handleResolverContestacao(resolver.contestacao.id_contestacao, resolver.status, decisao, novaNota),
            () => setResolver(null)
        );
    }

    const aceitando = resolver?.status === "aceita"

    return (
        <>
            <Card titulo={`Contestações (${contestacoes.length})`} sublinhado>
                {contestacoes.length === 0 ? (
                    <EmptyState mensagem={VAZIO[filtro] ?? VAZIO[""]} />
                ) : (
                    <ul className={lista.lista}>
                        {contestacoes.map((c) => (
                            <li key={c.id_contestacao}>
                                <ListItem>
                                    <span className={lista.nome}>{c.aluno.nome} · {c.atividade.titulo}</span>
                                    <span className={lista.detalhe}>
                                        Sala {c.sala.nome} · {c.atividade.conteudo?.nome ?? "sem conteúdo"} · {c.atividade.etapa}ª etapa · enviada em {formatarData(c.data_envio)}
                                    </span>
                                    <span className={lista.detalhe}>Nota atual: <strong>{formatarNota(c.nota.valor)}</strong></span>
                                    <span className={lista.texto}><strong>Justificativa do aluno:</strong> {c.comentario}</span>

                                    {c.status !== "pendente" && c.decisao && (
                                        <span className={lista.texto}>
                                            <strong>Decisão{c.data_resolucao && ` (${formatarData(c.data_resolucao)})`}:</strong> {c.decisao}
                                        </span>
                                    )}

                                    <span className={lista.etiquetas}>
                                        <Etiqueta cor={c.status === "pendente" ? "destaque" : c.status === "aceita" ? "sucesso" : "neutro"}>
                                            {ROTULO_STATUS[c.status]}
                                        </Etiqueta>
                                    </span>

                                    {c.status === "pendente" && (
                                        <span className={styles.acoes}>
                                            <Botao pequeno onClick={() => abrir(c, "aceita")}>Aceitar</Botao>
                                            <Botao pequeno variante="secundario" onClick={() => abrir(c, "recusada")}>Recusar</Botao>
                                        </span>
                                    )}
                                </ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <ConfirmDialog
            aberto={resolver !== null}
            titulo={aceitando ? "Aceitar contestação" : "Recusar contestação"}
            mensagem={aceitando
                ? `A nota atual (${resolver ? formatarNota(resolver.contestacao.nota.valor) : ""}) será SUBSTITUÍDA pela nova nota. O valor anterior não fica guardado.`
                : "Ao recusar, a nota do aluno não muda."}
            textoConfirmar={aceitando ? "Aceitar e substituir nota" : "Recusar contestação"}
            pendente={pendente}
            onConfirmar={confirmar}
            onFechar={() => setResolver(null)}
            >
                {aceitando && (
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
                label="Decisão (explique ao aluno)"
                name="contestacao_decisao"
                value={decisao}
                onChange={(e) => setDecisao(e.target.value)}
                />
            </ConfirmDialog>
        </>
    )
}
