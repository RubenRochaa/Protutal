import React, { useCallback, useContext, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { EvitarTeclado, RolagemTeclado } from "../../../components/EvitarTeclado";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { TextArea } from "../../../components/TextArea";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { ModalPicker, OptionProps } from "../../../components/ModalPicker";
import { ArquivoEscolhido, FileUpload, anexarArquivo } from "../../../components/FileUpload";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { MASCOTES } from "../../../lib/mascotes";
import { TutoriaAluno } from "../../../lib/types";
import { AlunoScreenProps } from "../../../routes/aluno.routes";
import { colors, fonts, fontSizes, radius, sizes, spacing } from "../../../styles/theme";

const ETAPAS: OptionProps[] = [
    { value: "1", label: "1ª etapa" },
    { value: "2", label: "2ª etapa" },
    { value: "3", label: "3ª etapa" },
]

// Mesmas regras da A10 (aqui aceitando vírgula, que é trocada por ponto antes de enviar)
const NOTA_VALIDA = /^\d+([.,]\d{1,2})?$/

type Erros = Partial<Record<"etapa" | "nota" | "file", string>>

const TITULO = "Avaliar meu tutor";

// Tela "Avaliar meu tutor" (rota A10 - POST /tutorias/:id/feedbacks), sem print no Figma:
// segue o formulário do site (etapa, nota, comentário opcional e rubrica obrigatória).
// Só a tutoria ativa mostra o formulário; um feedback por etapa (a API avisa com 409)
export default function FeedbackTutor({ navigation, route }: AlunoScreenProps<"FeedbackTutor">){
    const { id_tutoria } = route.params;
    const { showToast } = useContext(ToastContext);

    const [etapa, setEtapa] = useState("");
    const [nota, setNota] = useState("");
    const [comentario, setComentario] = useState("");
    const [arquivo, setArquivo] = useState<ArquivoEscolhido | null>(null);
    const [erros, setErros] = useState<Erros>({});
    const [pickerAberto, setPickerAberto] = useState(false);
    const [enviando, setEnviando] = useState(false);

    // Não há rota de detalhe: procura a tutoria na lista do aluno (A3)
    const buscar = useCallback(async () => {
        const tutorias = (await api.get<TutoriaAluno[]>("/alunos/me/tutorias")).data;

        return tutorias.find((item) => item.id_tutoria === id_tutoria) ?? null;
    }, [id_tutoria])

    const { dados: tutoria, erro, carregando, tentarNovamente } = useBuscar(buscar);

    function validar(): Erros {
        const encontrados: Erros = {};
        const notaDigitada = nota.trim();

        if(!ETAPAS.some((opcao) => opcao.value === etapa)) encontrados.etapa = "Escolha a etapa.";

        if(notaDigitada === "") encontrados.nota = "Informe a nota.";
        else if(!NOTA_VALIDA.test(notaDigitada) || Number(notaDigitada.replace(",", ".")) > 10){
            encontrados.nota = "A nota deve ser de 0 a 10, com no máximo 2 casas decimais (ex.: 8,5).";
        }

        if(!arquivo) encontrados.file = "Escolha o arquivo da rubrica.";

        return encontrados;
    }

    async function handleEnviar(){
        const encontrados = validar();
        setErros(encontrados);

        if(Object.keys(encontrados).length > 0 || !arquivo) return;

        // multipart/form-data: etapa, nota (com ponto), comentario (só se preenchido) e file (rubrica)
        const corpo = new FormData();
        corpo.append("etapa", etapa);
        corpo.append("nota", nota.trim().replace(",", "."));
        if(comentario.trim() !== "") corpo.append("comentario", comentario.trim());
        anexarArquivo(corpo, arquivo);

        setEnviando(true);

        try {
            await api.post(`/tutorias/${id_tutoria}/feedbacks`, corpo, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            showToast("sucesso", "Avaliação enviada!");
            navigation.goBack();
        } catch(err) {
            // 409 "tutoria finalizada" ou "já existe feedback nesta etapa", 403 "não é o tutorado"
            showToast("erro", getErrorMessage(err));
        } finally {
            setEnviando(false);
        }
    }

    function conteudo(){
        if(carregando) return <Loader />;
        // dados null também quer dizer "não encontrada"; com erro, foi a busca que falhou
        if(erro && !tutoria) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        if(!tutoria){
            return (
                <View style={styles.bloco}>
                    <EmptyState image={MASCOTES.badRequest} title="Tutoria não encontrada." />
                    <Button title="Voltar" variant="secundario" onPress={navigation.goBack} />
                </View>
            )
        }

        if(tutoria.status !== "ativa"){
            return (
                <Card title={TITULO}>
                    <EmptyState title="Esta tutoria foi finalizada. Não é mais possível avaliar o tutor." />
                </Card>
            )
        }

        const rotuloEtapa = ETAPAS.find((opcao) => opcao.value === etapa)?.label;

        return (
            <Card title={`Avaliar o tutor ${tutoria.tutor.nome}`}>
                <Text style={styles.explicacao}>
                    A rubrica é o documento que formaliza a sua avaliação: nele você registra, item por item,
                    como foi o trabalho do tutor. O professor usa a rubrica para avaliar o tutor.
                    Você pode enviar uma avaliação por etapa.
                </Text>

                <View style={styles.bloco}>
                    <Text style={styles.label}>Etapa</Text>
                    <TouchableOpacity
                    style={[styles.select, !!erros.etapa && styles.selectErro]}
                    onPress={() => setPickerAberto(true)}
                    disabled={enviando}
                    accessibilityRole="button"
                    accessibilityLabel={`Etapa: ${rotuloEtapa ?? "escolha a etapa"}`}
                    >
                        <Text style={[styles.valorSelect, !rotuloEtapa && styles.placeholder]}>{rotuloEtapa ?? "Escolha a etapa"}</Text>
                        <Feather name="chevron-down" size={18} color={colors.gray700} />
                    </TouchableOpacity>
                    {erros.etapa && <Text style={styles.erro}>{erros.etapa}</Text>}
                </View>

                <View style={styles.bloco}>
                    <Input
                    label="Nota (0 a 10)"
                    placeholder="Ex.: 8,5"
                    keyboardType="decimal-pad"
                    value={nota}
                    onChangeText={(valor) => { setNota(valor); setErros((atual) => ({ ...atual, nota: undefined })); }}
                    editable={!enviando}
                    />
                    {erros.nota && <Text style={styles.erro}>{erros.nota}</Text>}
                </View>

                <TextArea
                label="Comentário (opcional)"
                placeholder="Conte como o tutor ajudou você"
                value={comentario}
                onChangeText={setComentario}
                editable={!enviando}
                />

                <View style={styles.bloco}>
                    <Text style={styles.label}>Rubrica</Text>
                    <FileUpload
                    arquivo={arquivo}
                    onChange={(novo) => { setArquivo(novo); setErros((atual) => ({ ...atual, file: undefined })); }}
                    disabled={enviando}
                    erro={erros.file}
                    />
                </View>

                <Button title="Enviar avaliação" titleLoading="Enviando..." loading={enviando} onPress={handleEnviar} />

                <Modal transparent visible={pickerAberto} animationType="fade" onRequestClose={() => setPickerAberto(false)}>
                    <ModalPicker
                    options={ETAPAS}
                    selectedValue={etapa}
                    handleCloseModal={() => setPickerAberto(false)}
                    selectedItem={(item) => { setEtapa(String(item.value)); setErros((atual) => ({ ...atual, etapa: undefined })); }}
                    />
                </Modal>
            </Card>
        )
    }

    return (
        <View style={styles.container}>
            <Header title={TITULO} onBack={navigation.goBack} />

            <EvitarTeclado style={styles.container}>
                <RolagemTeclado contentContainerStyle={styles.conteudo}>
                    {conteudo()}
                </RolagemTeclado>
            </EvitarTeclado>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    conteudo:{
        flexGrow: 1,
        gap: spacing.lg,
        padding: spacing.lg
    },
    bloco:{
        gap: spacing.xs
    },
    explicacao:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    label:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.label,
        color: colors.black
    },
    select:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: sizes.input,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.borderInput,
        borderRadius: radius.input,
        backgroundColor: colors.white
    },
    selectErro:{
        borderColor: colors.red700
    },
    valorSelect:{
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    },
    placeholder:{
        color: colors.gray500
    },
    erro:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.red700
    }
})
