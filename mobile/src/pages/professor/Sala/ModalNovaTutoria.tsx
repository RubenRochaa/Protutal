import React, { useContext, useState } from "react";
import { Text, StyleSheet } from "react-native";

import { Janela } from "../../../components/Janela";
import { Select } from "../../../components/Select";
import { Button } from "../../../components/Button";
import { TextArea } from "../../../components/TextArea";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { useAcao } from "../../../lib/useAcao";
import { AlunoSala, TutorSala } from "../../../lib/types";
import { colors, fonts } from "../../../styles/theme";

interface ModalNovaTutoriaProps {
    visivel: boolean;
    // Tutores ativos da sala (P24) e alunos matriculados (P23)
    tutores: TutorSala[];
    alunos: AlunoSala[];
    onClose: () => void;
    onCriada: () => void;
}

// Modal "Nova tutoria" do site (tutorias/components/modalNovaTutoria): escolher o tutor,
// o aluno e escrever a meta (P30). Os três campos são conferidos antes de enviar
export function ModalNovaTutoria({ visivel, tutores, alunos, onClose, onCriada }: ModalNovaTutoriaProps){
    const { showToast } = useContext(ToastContext);
    const { executando, executar } = useAcao();

    const [tutor, setTutor] = useState("");
    const [aluno, setAluno] = useState("");
    const [meta, setMeta] = useState("");

    const tutorEscolhido = tutores.find((t) => String(t.id_tutor_sala) === tutor);
    // O tutor não pode ser tutor de si mesmo: ele sai da lista de alunos
    const alunosDisponiveis = alunos.filter((a) => a.id_aluno !== tutorEscolhido?.aluno.id_aluno);

    function limpar(){
        setTutor("");
        setAluno("");
        setMeta("");
    }

    function fechar(){
        if(executando) return;

        limpar();
        onClose();
    }

    // Mesmas validações do site (e da P30) antes de chamar a API
    async function handleCriar(){
        if(!tutor) return showToast("erro", "Escolha o tutor");
        if(!aluno) return showToast("erro", "Escolha o aluno");
        if(tutorEscolhido && Number(aluno) === tutorEscolhido.aluno.id_aluno) return showToast("erro", "O tutor não pode ser tutor de si mesmo");
        if(meta.trim() === "") return showToast("erro", "O campo meta_aprendizagem é obrigatório");

        const ok = await executar(
            () => api.post("/tutorias", { id_tutor_sala: Number(tutor), id_aluno: Number(aluno), meta_aprendizagem: meta.trim() }),
            "Tutoria criada!",
            onCriada
        );

        if(ok){
            limpar();
            onClose();
        }
    }

    const semDados = tutores.length === 0 || alunos.length === 0;

    return (
        <Janela visivel={visivel} titulo="Nova tutoria" onClose={fechar}>
            {semDados ? (
                <Text style={styles.aviso}>
                    Para criar uma tutoria, a sala precisa ter pelo menos um tutor (aba "Pedidos")
                    e alunos matriculados (aba "Alunos").
                </Text>
            ) : (
                <>
                    <Select
                    label="Tutor"
                    placeholder="Selecione o tutor"
                    options={tutores.map((t) => ({ value: String(t.id_tutor_sala), label: t.aluno.nome }))}
                    value={tutor}
                    onChange={(valor) => { setTutor(valor); setAluno(""); }}
                    disabled={executando}
                    />

                    <Select
                    label="Aluno tutorado"
                    placeholder="Selecione o aluno"
                    options={alunosDisponiveis.map((a) => ({ value: String(a.id_aluno), label: a.nome }))}
                    value={aluno}
                    onChange={setAluno}
                    disabled={executando}
                    />

                    <TextArea
                    label="Meta de aprendizagem"
                    placeholder="Ex.: Interpretar mapas temáticos e identificar as formas de relevo do Brasil."
                    value={meta}
                    onChangeText={setMeta}
                    editable={!executando}
                    />

                    <Button title="Criar tutoria" titleLoading="Criando..." loading={executando} onPress={handleCriar} />
                </>
            )}

            <Button title="Cancelar" variant="secundario" onPress={fechar} disabled={executando} />
        </Janela>
    )
}

const styles = StyleSheet.create({
    aviso:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    }
})
