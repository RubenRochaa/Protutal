"use client"

import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { toast } from 'sonner'
import { AlunoSala, TutorSala } from '@/lib/types'
import { textoVazio } from '@/lib/validacao'
import { useAcao } from '@/lib/useAcao'
import { Modal } from '@/components/modal'
import { Select } from '@/components/select'
import { Textarea } from '@/components/textarea'
import { Botao } from '@/components/botao'
import { handleCriarTutoria } from '@/app/professor/actions'

interface Props {
    aberto: boolean;
    onFechar: () => void;
    // Tutores ativos da sala (P24) e alunos matriculados (P23)
    tutores: TutorSala[];
    alunos: AlunoSala[];
}

// Modal "Nova tutoria" (adaptado da p07): escolher o tutor, o aluno e escrever a meta (P30).
// Os três campos são obrigatórios e são conferidos antes de enviar.
export function ModalNovaTutoria({ aberto, onFechar, tutores, alunos }: Props){
    const [tutor, setTutor] = useState("");
    const [aluno, setAluno] = useState("");
    const [meta, setMeta] = useState("");
    const { pendente, executar } = useAcao();

    const tutorEscolhido = tutores.find((t) => String(t.id_tutor_sala) === tutor)

    // O tutor não pode ser tutor de si mesmo: ele sai da lista de alunos
    const alunosDisponiveis = alunos.filter((a) => a.id_aluno !== tutorEscolhido?.aluno.id_aluno)

    function fechar(){
        setTutor("");
        setAluno("");
        setMeta("");
        onFechar();
    }

    // Validação no navegador antes de chamar a API (as mesmas regras da P30)
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();

        if(!tutor) return toast.error("Escolha o tutor");
        if(!aluno) return toast.error("Escolha o aluno");
        if(tutorEscolhido && Number(aluno) === tutorEscolhido.aluno.id_aluno) return toast.error("O tutor não pode ser tutor de si mesmo");
        if(textoVazio(meta)) return toast.error("O campo meta_aprendizagem é obrigatório");

        executar(() => handleCriarTutoria(Number(tutor), Number(aluno), meta), fechar);
    }

    const semDados = tutores.length === 0 || alunos.length === 0

    return (
        <Modal aberto={aberto} onFechar={fechar} titulo="Nova tutoria">
            {semDados ? (
                <p className={lista.ajuda}>
                    Para criar uma tutoria, a sala precisa ter pelo menos um tutor (aba &quot;Pedidos&quot;)
                    e alunos matriculados (aba &quot;Alunos&quot;).
                </p>
            ) : (
                <form onSubmit={handleSubmit} className={lista.form} noValidate>
                    <Select
                    label="Tutor"
                    name="tutoria_tutor"
                    placeholder="Selecione o tutor"
                    opcoes={tutores.map((t) => ({ valor: String(t.id_tutor_sala), rotulo: t.aluno.nome }))}
                    value={tutor}
                    onChange={(e) => { setTutor(e.target.value); setAluno(""); }}
                    />

                    <Select
                    label="Aluno tutorado"
                    name="tutoria_aluno"
                    placeholder="Selecione o aluno"
                    opcoes={alunosDisponiveis.map((a) => ({ valor: String(a.id_aluno), rotulo: a.nome }))}
                    value={aluno}
                    onChange={(e) => setAluno(e.target.value)}
                    />

                    <Textarea
                    label="Meta de aprendizagem"
                    name="tutoria_meta"
                    placeholder="Ex.: Interpretar mapas temáticos e identificar as formas de relevo do Brasil."
                    value={meta}
                    onChange={(e) => setMeta(e.target.value)}
                    />

                    <div className={lista.formAcoes}>
                        <Botao variante="secundario" onClick={fechar} disabled={pendente}>Cancelar</Botao>
                        <Botao type="submit" disabled={pendente}>{pendente ? "Criando..." : "Criar tutoria"}</Botao>
                    </div>
                </form>
            )}
        </Modal>
    )
}
