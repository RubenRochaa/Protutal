import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Janela } from "../../../components/Janela";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { TextArea } from "../../../components/TextArea";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { useAcao } from "../../../lib/useAcao";
import { validarNota } from "../../../lib/validacao";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { formatarData, formatarMedia, formatarNota } from "../../../lib/formatacao";
import { AvaliacoesTutor, TutorSala } from "../../../lib/types";
import { colors, fonts, fontSizes, spacing } from "../../../styles/theme";

interface ModalAvaliacaoProps {
    // null = janela fechada
    tutor: TutorSala | null;
    onClose: () => void;
}

// Modal "Avaliar tutor" do site (tutores/components/modalAvaliacao). As estrelas do Figma viraram
// a nota de 0 a 10 da API: mostra as avaliações já feitas (P10) e registra uma nova (P9).
// O mesmo tutor pode receber várias avaliações
export function ModalAvaliacao({ tutor, onClose }: ModalAvaliacaoProps){
    const { showToast } = useContext(ToastContext);
    const { executando, executar } = useAcao();

    const [historico, setHistorico] = useState<AvaliacoesTutor | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [nota, setNota] = useState("");
    const [comentario, setComentario] = useState("");

    const idTutorSala = tutor?.id_tutor_sala ?? null;

    // Ao abrir (ou depois de avaliar), busca o histórico
    const carregarHistorico = useCallback(async (id: number) => {
        setCarregando(true);

        try {
            setHistorico((await api.get<AvaliacoesTutor>(`/tutores-sala/${id}/avaliacoes`)).data);
        } catch(err) {
            if(getErrorStatus(err) !== 401) showToast("erro", getErrorMessage(err));
        } finally {
            setCarregando(false);
        }
    }, [showToast])

    useEffect(() => {
        if(idTutorSala !== null) carregarHistorico(idTutorSala);
    }, [idTutorSala, carregarHistorico])

    function fechar(){
        if(executando) return;

        setHistorico(null);
        setNota("");
        setComentario("");
        onClose();
    }

    // Mesmas validações do site (e da P9) antes de chamar a API
    function handleRegistrar(){
        if(!tutor) return;

        const resultado = validarNota(nota, "nota");
        if("erro" in resultado) return showToast("erro", resultado.erro);
        if(comentario.trim() === "") return showToast("erro", "O campo comentario é obrigatório e não pode ser vazio");

        executar(
            () => api.post(`/tutores-sala/${tutor.id_tutor_sala}/avaliacoes`, { nota: resultado.valor, comentario: comentario.trim() }),
            "Avaliação registrada!",
            () => {
                setNota("");
                setComentario("");
                carregarHistorico(tutor.id_tutor_sala);
            }
        );
    }

    return (
        <Janela visivel={tutor !== null} titulo={`Avaliar tutor: ${tutor?.aluno.nome ?? ""}`} onClose={fechar}>
            <Text style={styles.subtitulo}>Avaliações anteriores</Text>

            {carregando && <Loader size="pequeno" />}

            {!carregando && historico && (
                <>
                    <Text style={styles.texto}>
                        {historico.resumo.total_avaliacoes} avaliação(ões) · média{" "}
                        <Text style={styles.destaque}>{formatarMedia(historico.resumo.media_notas, "Sem avaliação")}</Text>
                    </Text>

                    {historico.avaliacoes.map((avaliacao) => (
                        <View key={avaliacao.id_avaliacao} style={styles.avaliacao}>
                            <Text style={styles.nota}>Nota {formatarNota(avaliacao.nota)} · {formatarData(avaliacao.data)}</Text>
                            <Text style={styles.texto}>{avaliacao.comentario}</Text>
                            <Text style={styles.detalhe}>por {avaliacao.professor.nome}</Text>
                        </View>
                    ))}
                </>
            )}

            <Text style={styles.subtitulo}>Nova avaliação</Text>

            <Input
            label="Nota (0 a 10)"
            placeholder="Ex.: 8,5"
            keyboardType="decimal-pad"
            value={nota}
            onChangeText={setNota}
            editable={!executando}
            />

            <TextArea
            label="Comentário"
            placeholder="Como o tutor tem acompanhado os tutorados?"
            value={comentario}
            onChangeText={setComentario}
            editable={!executando}
            />

            <Button title="Registrar avaliação" titleLoading="Enviando..." loading={executando} onPress={handleRegistrar} />
            <Button title="Fechar" variant="secundario" onPress={fechar} disabled={executando} />
        </Janela>
    )
}

const styles = StyleSheet.create({
    subtitulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    destaque:{
        fontFamily: fonts.semibold
    },
    avaliacao:{
        gap: 2,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300
    },
    nota:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.red700
    },
    detalhe:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    }
})
