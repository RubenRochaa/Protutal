"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AvaliacoesTutor, TutorSala } from '@/lib/types'
import { formatarData, formatarMedia, formatarNota } from '@/lib/formatacao'
import { textoVazio, validarNota } from '@/lib/validacao'
import { useAcao } from '@/lib/useAcao'
import { Modal } from '@/components/modal'
import { Input } from '@/components/input'
import { Textarea } from '@/components/textarea'
import { Botao } from '@/components/botao'
import { buscarAvaliacoesTutor, handleAvaliarTutor } from '@/app/professor/actions'

interface Props {
    // null = modal fechado
    tutor: TutorSala | null;
    onFechar: () => void;
}

// Modal "Avaliar tutor" (sem Figma; padrão "Formulário").
// Mostra as avaliações já feitas (P10) e registra uma nova (P9): nota de 0 a 10 e comentário.
// O mesmo tutor pode receber várias avaliações.
export function ModalAvaliacao({ tutor, onFechar }: Props){
    const [historico, setHistorico] = useState<AvaliacoesTutor | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [nota, setNota] = useState("");
    const [comentario, setComentario] = useState("");
    const { pendente, executar } = useAcao();

    const idTutorSala = tutor?.id_tutor_sala ?? null

    // Ao abrir (ou depois de avaliar), busca o histórico no servidor
    async function carregarHistorico(id: number){
        setCarregando(true);
        const resultado = await buscarAvaliacoesTutor(id);
        setCarregando(false);

        if("error" in resultado){
            toast.error(resultado.error);
            return;
        }

        setHistorico(resultado.dados);
    }

    useEffect(() => {
        if(idTutorSala !== null) carregarHistorico(idTutorSala);
    }, [idTutorSala]);

    function fechar(){
        setHistorico(null);
        setNota("");
        setComentario("");
        onFechar();
    }

    // Validação no navegador antes de chamar a API (as mesmas regras da P9)
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        if(!tutor) return;

        const resultado = validarNota(nota, "nota");
        if("erro" in resultado) return toast.error(resultado.erro);
        if(textoVazio(comentario)) return toast.error("O campo comentario é obrigatório e não pode ser vazio");

        executar(() => handleAvaliarTutor(tutor.id_tutor_sala, nota, comentario), () => {
            setNota("");
            setComentario("");
            carregarHistorico(tutor.id_tutor_sala);
        });
    }

    return (
        <Modal aberto={tutor !== null} onFechar={fechar} titulo={`Avaliar tutor: ${tutor?.aluno.nome ?? ""}`}>
            <div className={styles.conteudo}>
                <section className={styles.historico} aria-busy={carregando}>
                    <h3 className={styles.subtitulo}>Avaliações anteriores</h3>

                    {carregando && <p className={lista.detalhe}>Carregando...</p>}

                    {!carregando && historico && (
                        <>
                            <p className={lista.detalhe}>
                                {historico.resumo.total_avaliacoes} avaliação(ões) · média{" "}
                                <strong>{formatarMedia(historico.resumo.media_notas, "Sem avaliação")}</strong>
                            </p>

                            {historico.avaliacoes.length > 0 && (
                                <ul className={styles.itens}>
                                    {historico.avaliacoes.map((avaliacao) => (
                                        <li key={avaliacao.id_avaliacao} className={styles.item}>
                                            <span className={lista.nome}>
                                                Nota {formatarNota(avaliacao.nota)} · {formatarData(avaliacao.data)}
                                            </span>
                                            <span className={lista.texto}>{avaliacao.comentario}</span>
                                            <span className={lista.detalhe}>por {avaliacao.professor.nome}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </section>

                <form onSubmit={handleSubmit} className={lista.form} noValidate>
                    <h3 className={styles.subtitulo}>Nova avaliação</h3>

                    <Input
                    label="Nota (0 a 10)"
                    name="avaliacao_nota"
                    inputMode="decimal"
                    placeholder="Ex.: 8,5"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    />

                    <Textarea
                    label="Comentário"
                    name="avaliacao_comentario"
                    placeholder="Como o tutor tem acompanhado os tutorados?"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    />

                    <div className={lista.formAcoes}>
                        <Botao variante="secundario" onClick={fechar} disabled={pendente}>Fechar</Botao>
                        <Botao type="submit" disabled={pendente}>{pendente ? "Enviando..." : "Registrar avaliação"}</Botao>
                    </div>
                </form>
            </div>
        </Modal>
    )
}
