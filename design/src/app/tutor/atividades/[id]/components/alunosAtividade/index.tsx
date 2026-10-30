"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { RespostasAtividade } from '@/lib/types'
import { formatarDataHora, formatarNota } from '@/lib/formatacao'
import { validarNota } from '@/lib/validacao'
import { useAcao } from '@/lib/useAcao'
import { ListItem } from '@/components/listItem'
import { Avatar } from '@/components/avatar'
import { EmptyState } from '@/components/emptyState'
import { Modal } from '@/components/modal'
import { ConfirmDialog } from '@/components/confirmDialog'
import { Input } from '@/components/input'
import { Textarea } from '@/components/textarea'
import { Botao } from '@/components/botao'
import { Etiqueta } from '@/components/etiqueta'
import { handleLancarNota } from '../../../../actions'

type Destinatario = RespostasAtividade["alunos"][number]

interface Props {
    idAtividade: number;
    alunos: Destinatario[];
    // Calculado no servidor: sem resposta, a nota só pode ser lançada depois do prazo (T3)
    prazoVencido: boolean;
    // Prazo já formatado (dd/mm/aaaa)
    prazo: string;
}

const STATUS = {
    pendente: "Não enviou",
    entregue: "Entregue",
    entregue_com_atraso: "Entregue com atraso",
}

// Listas "Alunos que enviaram" e "Ainda não enviaram" (print 6). Clicar num aluno abre
// o modal "Envio do aluno" (print 7) com o arquivo, o comentário e o lançamento de nota (T3).
// A nota não pode ser alterada depois: o ConfirmDialog avisa antes de enviar
export function AlunosAtividade({ idAtividade, alunos, prazoVencido, prazo }: Props){
    const [selecionado, setSelecionado] = useState<Destinatario | null>(null);
    const [confirmando, setConfirmando] = useState(false);
    const [valor, setValor] = useState("");
    const [comentario, setComentario] = useState("");
    const { pendente, executar } = useAcao();

    const enviaram = alunos.filter((a) => a.resposta !== null)
    const naoEnviaram = alunos.filter((a) => a.resposta === null)

    function abrir(destinatario: Destinatario){
        setValor("");
        setComentario("");
        setConfirmando(false);
        setSelecionado(destinatario);
    }

    function fechar(){
        setConfirmando(false);
        setSelecionado(null);
    }

    // Mesmas regras da T3 antes de pedir a confirmação
    function pedirConfirmacao(){
        const nota = validarNota(valor, "valor");
        if("erro" in nota) return toast.error(nota.erro);

        setConfirmando(true);
    }

    function confirmar(){
        if(!selecionado) return;

        executar(
            () => handleLancarNota(idAtividade, selecionado.aluno.id_aluno, valor, comentario),
            fechar
        );
    }

    function item(d: Destinatario){
        return (
            <li key={d.aluno.id_aluno}>
                <button type="button" className={styles.item} onClick={() => abrir(d)} aria-label={`Ver envio de ${d.aluno.nome}`}>
                    <ListItem
                    inicio={<Avatar nome={d.aluno.nome} />}
                    direita={<span className={lista.valor}>{d.nota ? formatarNota(d.nota.valor) : "—"}</span>}
                    >
                        <span className={lista.nome}>{d.aluno.nome}</span>
                        <span className={lista.etiquetas}>
                            <Etiqueta cor={d.status === "entregue" ? "sucesso" : "neutro"}>{STATUS[d.status]}</Etiqueta>
                            <Etiqueta cor={d.nota ? "sucesso" : "destaque"}>{d.nota ? "Com nota" : "Sem nota"}</Etiqueta>
                        </span>
                    </ListItem>
                </button>
            </li>
        )
    }

    // Sem resposta e com o prazo aberto, a T3 recusaria a nota (400)
    const aguardando = selecionado !== null && selecionado.resposta === null && !prazoVencido

    return (
        <>
            <div className={styles.bloco}>
                <h3 className={styles.titulo}>Alunos que enviaram:</h3>
                {enviaram.length === 0 ? (
                    <EmptyState mensagem="Nenhum aluno enviou esta atividade ainda." />
                ) : (
                    <ul className={lista.lista}>{enviaram.map(item)}</ul>
                )}
            </div>

            {naoEnviaram.length > 0 && (
                <div className={styles.bloco}>
                    <h3 className={styles.titulo}>Ainda não enviaram:</h3>
                    <ul className={lista.lista}>{naoEnviaram.map(item)}</ul>
                </div>
            )}

            {/* Print 7: "Envio do aluno" */}
            <Modal aberto={selecionado !== null && !confirmando} onFechar={fechar} titulo="Envio do aluno">
                {selecionado && (
                    <div className={styles.modal}>
                        <div className={styles.aluno}>
                            <Avatar nome={selecionado.aluno.nome} />
                            <span className={lista.nome}>{selecionado.aluno.nome}</span>
                            <Etiqueta cor={selecionado.status === "entregue" ? "sucesso" : "neutro"}>{STATUS[selecionado.status]}</Etiqueta>
                        </div>

                        {selecionado.resposta ? (
                            <dl className={styles.dados}>
                                <div>
                                    <dt>Enviado em</dt>
                                    <dd>{formatarDataHora(selecionado.resposta.data_envio)}</dd>
                                </div>
                                <div>
                                    <dt>Arquivo</dt>
                                    <dd>
                                        <a href={selecionado.resposta.conteudo_file} target="_blank" rel="noopener noreferrer" className={styles.download}>
                                            <Download size={18} aria-hidden="true" />
                                            Abrir arquivo
                                        </a>
                                    </dd>
                                </div>
                                {selecionado.resposta.texto && (
                                    <div>
                                        <dt>Comentário do aluno</dt>
                                        <dd className={lista.texto}>{selecionado.resposta.texto}</dd>
                                    </div>
                                )}
                            </dl>
                        ) : (
                            <p className={lista.detalhe}>O aluno não enviou resposta.</p>
                        )}

                        {selecionado.nota ? (
                            <dl className={styles.dados}>
                                <div>
                                    <dt>Nota</dt>
                                    <dd className={styles.nota}>{formatarNota(selecionado.nota.valor)}</dd>
                                </div>
                                {selecionado.nota.comentario && (
                                    <div>
                                        <dt>Seu comentário</dt>
                                        <dd className={lista.texto}>{selecionado.nota.comentario}</dd>
                                    </div>
                                )}
                            </dl>
                        ) : (
                            <fieldset className={styles.form} disabled={aguardando || pendente}>
                                <legend className={styles.legenda}>Lançar nota</legend>

                                {aguardando && (
                                    <p className={styles.aguardando} role="status">
                                        Aguardando a resposta do aluno até {prazo}.
                                    </p>
                                )}
                                {!aguardando && selecionado.resposta === null && (
                                    <p className={lista.detalhe}>O prazo venceu sem entrega: você pode lançar a nota.</p>
                                )}

                                <Input
                                label="Nota (0 a 10)"
                                name="nota_valor"
                                inputMode="decimal"
                                placeholder="Ex.: 7,5"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                />

                                <Textarea
                                label="Comentário (opcional)"
                                name="nota_comentario"
                                rows={3}
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                />

                                <div className={lista.formAcoes}>
                                    <Botao onClick={pedirConfirmacao} disabled={aguardando || pendente}>Enviar</Botao>
                                </div>
                            </fieldset>
                        )}
                    </div>
                )}
            </Modal>

            <ConfirmDialog
            aberto={confirmando}
            titulo="Lançar nota"
            mensagem={`Confirma a nota ${valor.trim()} para ${selecionado?.aluno.nome ?? ""}? A nota não pode ser alterada depois.`}
            textoConfirmar="Lançar nota"
            pendente={pendente}
            onConfirmar={confirmar}
            onFechar={() => setConfirmando(false)}
            />
        </>
    )
}
