"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AlunoSala, TutorSala, TutoriaSala } from '@/lib/types'
import { formatarData } from '@/lib/formatacao'
import { textoVazio } from '@/lib/validacao'
import { useAcao } from '@/lib/useAcao'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { ConfirmDialog } from '@/components/confirmDialog'
import { Modal } from '@/components/modal'
import { Textarea } from '@/components/textarea'
import { Botao } from '@/components/botao'
import { Etiqueta } from '@/components/etiqueta'
import { FiltroAbas } from '@/components/filtroAbas'
import { handleEditarMeta, handleFinalizarTutoria, handleReabrirTutoria } from '@/app/professor/actions'
import { ModalNovaTutoria } from '../modalNovaTutoria'

interface Props {
    tutorias: TutoriaSala[];
    tutores: TutorSala[];
    alunos: AlunoSala[];
    // "" = todas; "ativa" ou "finalizada"
    filtro: string;
    anoAtualDaSala: boolean;
    anoLetivo: number;
}

const OPCOES_FILTRO = [
    { valor: "", rotulo: "Todas" },
    { valor: "ativa", rotulo: "Ativas" },
    { valor: "finalizada", rotulo: "Finalizadas" },
]

// Ação que abre a confirmação: finalizar (P6) ou reabrir (P7)
type Confirmacao = { tipo: "finalizar" | "reabrir"; tutoria: TutoriaSala } | null

// Lista das tutorias da sala com o filtro de situação e as ações de cada item
export function ListaTutorias({ tutorias, tutores, alunos, filtro, anoAtualDaSala, anoLetivo }: Props){
    const [novaAberta, setNovaAberta] = useState(false);
    const [editarMeta, setEditarMeta] = useState<TutoriaSala | null>(null);
    const [meta, setMeta] = useState("");
    const [confirmacao, setConfirmacao] = useState<Confirmacao>(null);
    const { pendente, executar } = useAcao();

    function abrirMeta(tutoria: TutoriaSala){
        setMeta(tutoria.meta_aprendizagem ?? "");
        setEditarMeta(tutoria);
    }

    function salvarMeta(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        if(!editarMeta) return;
        if(textoVazio(meta)) return toast.error("O campo meta_aprendizagem é obrigatório");

        executar(() => handleEditarMeta(editarMeta.id_tutoria, meta), () => setEditarMeta(null));
    }

    function confirmar(){
        if(!confirmacao) return;
        const { tipo, tutoria } = confirmacao;
        const acao = tipo === "finalizar" ? handleFinalizarTutoria : handleReabrirTutoria;

        executar(() => acao(tutoria.id_tutoria), () => setConfirmacao(null));
    }

    const vazio = filtro === ""
        ? `A sala ainda não tem tutorias. Clique em "Nova tutoria" para ligar um tutor a um aluno.`
        : `Nenhuma tutoria ${filtro === "ativa" ? "ativa" : "finalizada"} nesta sala.`

    return (
        <div className={lista.tela}>
            <div className={lista.topo}>
                <FiltroAbas parametro="status" opcoes={OPCOES_FILTRO} valor={filtro} rotulo="Filtrar tutorias por situação" />

                <Botao onClick={() => setNovaAberta(true)}>
                    <Plus size={20} aria-hidden="true" />
                    Nova tutoria
                </Botao>
            </div>

            <Card titulo={`Tutorias (${tutorias.length})`} sublinhado>
                {tutorias.length === 0 ? (
                    <EmptyState mensagem={vazio} />
                ) : (
                    <ul className={lista.lista}>
                        {tutorias.map((tutoria) => {
                            const ativa = tutoria.status === "ativa";

                            return (
                                <li key={tutoria.id_tutoria}>
                                    <ListItem>
                                        <div className={styles.linha}>
                                            <div className={styles.dados}>
                                                <span className={lista.nome}>
                                                    {tutoria.tutor.nome} → {tutoria.aluno.nome}
                                                </span>
                                                <span className={lista.detalhe}>
                                                    Tutor → tutorado · início {formatarData(tutoria.data_inicio)}
                                                    {tutoria.data_fim && ` · fim ${formatarData(tutoria.data_fim)}`}
                                                </span>
                                                <span className={lista.texto}>
                                                    <strong>Meta:</strong> {tutoria.meta_aprendizagem || "Sem meta definida"}
                                                </span>
                                                <span className={lista.etiquetas}>
                                                    <Etiqueta cor={ativa ? "sucesso" : "neutro"}>{ativa ? "Ativa" : "Finalizada"}</Etiqueta>
                                                </span>
                                            </div>

                                            <div className={lista.acoes}>
                                                {ativa ? (
                                                    <>
                                                        <Botao pequeno variante="secundario" onClick={() => abrirMeta(tutoria)}>Editar meta</Botao>
                                                        <Botao pequeno variante="perigo" onClick={() => setConfirmacao({ tipo: "finalizar", tutoria })}>Finalizar</Botao>
                                                    </>
                                                ) : (
                                                    <Botao
                                                    pequeno
                                                    variante="secundario"
                                                    disabled={!anoAtualDaSala}
                                                    title={anoAtualDaSala ? undefined : `Só é possível reabrir tutorias do ano letivo atual (esta sala é de ${anoLetivo})`}
                                                    onClick={() => setConfirmacao({ tipo: "reabrir", tutoria })}
                                                    >
                                                        Reabrir
                                                    </Botao>
                                                )}
                                            </div>
                                        </div>
                                        {!ativa && !anoAtualDaSala && (
                                            <span className={lista.detalhe}>
                                                Não dá para reabrir: a sala é do ano letivo {anoLetivo}.
                                            </span>
                                        )}
                                    </ListItem>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </Card>

            <ModalNovaTutoria aberto={novaAberta} onFechar={() => setNovaAberta(false)} tutores={tutores} alunos={alunos} />

            <Modal aberto={editarMeta !== null} onFechar={() => setEditarMeta(null)} titulo="Editar meta de aprendizagem">
                <form onSubmit={salvarMeta} className={lista.form} noValidate>
                    <p className={lista.detalhe}>
                        {editarMeta && `${editarMeta.tutor.nome} → ${editarMeta.aluno.nome}`}
                    </p>
                    <Textarea
                    label="Meta de aprendizagem"
                    name="meta_edicao"
                    value={meta}
                    onChange={(e) => setMeta(e.target.value)}
                    />
                    <div className={lista.formAcoes}>
                        <Botao variante="secundario" onClick={() => setEditarMeta(null)} disabled={pendente}>Cancelar</Botao>
                        <Botao type="submit" disabled={pendente}>{pendente ? "Salvando..." : "Salvar meta"}</Botao>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
            aberto={confirmacao !== null}
            titulo={confirmacao?.tipo === "finalizar" ? "Finalizar tutoria" : "Reabrir tutoria"}
            mensagem={confirmacao?.tipo === "finalizar"
                ? `Finalizar a tutoria de ${confirmacao.tutoria.tutor.nome} com ${confirmacao.tutoria.aluno.nome}? Depois de finalizada, ela não aceita novas atividades, notas nem mensagens. Se houver contestação de nota pendente, a finalização é bloqueada.`
                : `Reabrir a tutoria de ${confirmacao?.tutoria.tutor.nome ?? ""} com ${confirmacao?.tutoria.aluno.nome ?? ""}? Ela volta a ficar ativa.`
            }
            textoConfirmar={confirmacao?.tipo === "finalizar" ? "Finalizar" : "Reabrir"}
            pendente={pendente}
            onConfirmar={confirmar}
            onFechar={() => setConfirmacao(null)}
            />
        </div>
    )
}
