import React, { useContext, useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Janela } from "../Janela";
import { Input } from "../Input";
import { Select } from "../Select";
import { Button } from "../Button";
import { TextArea } from "../TextArea";
import { ToastContext } from "../../contexts/ToastContext";

import { api } from "../../services/api";
import { useAcao } from "../../lib/useAcao";
import { Sala } from "../../lib/types";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, spacing } from "../../styles/theme";

// Mesmo limite do back-end (P3)
const MAX_TITULO = 150;

interface ModalAvisoProps {
    visivel: boolean;
    onClose: () => void;
    // Dentro da sala: o aviso vai para esta sala
    idSala?: number;
    // Na tela Notificações: o professor escolhe a sala (lista da P20)
    salas?: Sala[];
    onEnviado?: () => void;
}

// Modal "Enviar aviso para a sala" do site (professor/components/modalAviso), rota P3
// (POST /salas/:id/avisos). O aviso vai para todos os alunos da sala; a API exige
// pelo menos uma tutoria ativa na sala
export function ModalAviso({ visivel, onClose, idSala, salas, onEnviado }: ModalAvisoProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { executando, executar } = useAcao();
    const { showToast } = useContext(ToastContext);

    const [sala, setSala] = useState("");
    const [titulo, setTitulo] = useState("");
    const [recado, setRecado] = useState("");

    function fechar(){
        if(executando) return;

        setSala("");
        setTitulo("");
        setRecado("");
        onClose();
    }

    // Mesmas validações do site antes de chamar a P3
    async function handleEnviar(){
        const mostrarErro = (mensagem: string) => showToast("erro", mensagem);
        const destino = idSala ?? Number(sala);

        if(!destino) return mostrarErro("Escolha a sala do aviso");
        if(titulo.trim() === "") return mostrarErro("O campo titulo é obrigatório");
        if(titulo.trim().length > MAX_TITULO) return mostrarErro(`O título deve ter no máximo ${MAX_TITULO} caracteres`);
        if(recado.trim() === "") return mostrarErro("O campo conteudo é obrigatório");

        const ok = await executar(
            () => api.post(`/salas/${destino}/avisos`, { titulo: titulo.trim(), conteudo: recado.trim() }),
            "Aviso publicado para a sala!",
            onEnviado
        );

        if(ok){
            setSala("");
            setTitulo("");
            setRecado("");
            onClose();
        }
    }

    return (
        <Janela visivel={visivel} titulo="Enviar aviso para a sala" onClose={fechar}>
            {idSala === undefined && (
                <Select
                label="Sala"
                placeholder="Selecione a sala"
                options={(salas ?? []).map((s) => ({ value: String(s.id_sala), label: `${s.nome} (${s.ano_letivo})` }))}
                value={sala}
                onChange={setSala}
                disabled={executando}
                />
            )}

            <Input
            label="Título"
            placeholder="Ex.: Entrega das atividades da etapa 2"
            maxLength={MAX_TITULO}
            value={titulo}
            onChangeText={setTitulo}
            editable={!executando}
            />

            <TextArea
            label="Recado"
            placeholder="Escreva o recado para os alunos"
            value={recado}
            onChangeText={setRecado}
            editable={!executando}
            />

            <Text style={styles.ajuda}>
                O aviso aparece para todos os alunos matriculados na sala. Só é possível publicar
                quando a sala tem pelo menos uma tutoria ativa.
            </Text>

            <View style={styles.acoes}>
                <Button title="Enviar" titleLoading="Enviando..." loading={executando} onPress={handleEnviar} />
                <Button title="Cancelar" variant="secundario" onPress={fechar} disabled={executando} />
            </View>
        </Janela>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    ajuda:{
        fontFamily: fonts.regular,
        fontSize: fs(13),
        color: colors.gray700
    },
    acoes:{
        gap: spacing.md
    }
})
