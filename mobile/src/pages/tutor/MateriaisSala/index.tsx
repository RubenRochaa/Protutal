import React, { useCallback, useContext, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";

import { Header } from "../../../components/Header";
import { EvitarTeclado, useRolarAteCampo } from "../../../components/EvitarTeclado";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { Loader } from "../../../components/Loader";
import { TextArea } from "../../../components/TextArea";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { ItemMaterial } from "../../../components/ItemMaterial";
import { ArquivoEscolhido, FileUpload, anexarArquivo } from "../../../components/FileUpload";
import { AuthContext } from "../../../contexts/AuthContext";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { formatarData } from "../../../lib/formatacao";
import { MaterialSala, TutoriaTutor } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, fontSizes, spacing } from "../../../styles/theme";

const LIMITE_TITULO = 150;

interface Dados {
    // A T5 só aceita material de quem tem pelo menos uma tutoria ativa na sala
    temAtiva: boolean;
    materiais: MaterialSala[];
}

// Tela "Anexar materiais" (layout do Figma, regras do site em tutoria/components/materiaisSala):
// formulário de envio (rota T5, multipart) e lista dos materiais da sala (rota A5).
// Formatos e tamanho são os do FileUpload: PDF, DOC, DOCX, XLS, XLSX ou CSV, até 10 MB
export default function MateriaisSala({ navigation, route }: TutorScreenProps<"MateriaisSala">){
    const { id_sala, nome_sala } = route.params;
    const { user } = useContext(AuthContext);
    const { showToast } = useContext(ToastContext);

    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [arquivo, setArquivo] = useState<ArquivoEscolhido | null>(null);
    const [erroArquivo, setErroArquivo] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    // O formulário fica no topo da lista: ela rola até o campo em foco quando o teclado abre
    const listaRef = useRef<FlatList<MaterialSala>>(null);
    const obterRolagem = useCallback(() => listaRef.current?.getScrollResponder(), []);
    const rolagem = useRolarAteCampo(obterRolagem);

    const buscar = useCallback(async (): Promise<Dados> => {
        const [tutorias, materiais] = await Promise.all([
            api.get<TutoriaTutor[]>("/tutores/me/tutorias").then((r) => r.data),
            api.get<MaterialSala[]>(`/salas/${id_sala}/materiais`).then((r) => r.data)
        ]);

        const temAtiva = tutorias.some((tutoria) => tutoria.sala.id_sala === id_sala && tutoria.status === "ativa");

        return { temAtiva, materiais };
    }, [id_sala])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    // Mesmas validações do site antes da rota T5
    function validar(): string | null {
        if(titulo.trim() === "") return "O título do material é obrigatório";
        if(titulo.trim().length > LIMITE_TITULO) return "O título do material deve ter no máximo 150 caracteres";
        if(!arquivo) return "Escolha o arquivo do material.";

        return null;
    }

    async function handleAnexar(){
        const mensagemErro = validar();

        if(mensagemErro || !arquivo){
            if(!arquivo) setErroArquivo("Escolha o arquivo do material.");
            showToast("erro", mensagemErro ?? "Escolha o arquivo do material.");
            return;
        }

        // multipart/form-data: titulo, descricao (só se preenchida) e file
        const corpo = new FormData();
        corpo.append("titulo", titulo.trim());
        if(descricao.trim() !== "") corpo.append("descricao", descricao.trim());
        anexarArquivo(corpo, arquivo);

        setEnviando(true);

        try {
            await api.post(`/salas/${id_sala}/materiais`, corpo, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            showToast("sucesso", "Material anexado!");
            setTitulo("");
            setDescricao("");
            setArquivo(null);
            atualizar();
        } catch(err) {
            showToast("erro", getErrorMessage(err));
        } finally {
            setEnviando(false);
        }
    }

    // Igual ao site: o material do próprio tutor mostra só a data
    function detalhe(material: MaterialSala){
        const data = formatarData(material.data_envio);

        return material.tutor.nome === user.nome ? `Anexado em ${data}` : `Anexado por ${material.tutor.nome} em ${data}`;
    }

    function formulario(){
        if(!dados) return null;

        if(!dados.temAtiva){
            return (
                <Card>
                    <Text style={styles.aviso}>
                        Para anexar material, você precisa ter pelo menos uma tutoria ativa na sala.
                    </Text>
                </Card>
            )
        }

        return (
            <Card title="Anexar materiais">
                <FileUpload
                arquivo={arquivo}
                onChange={(novo) => { setArquivo(novo); setErroArquivo(null); }}
                disabled={enviando}
                erro={erroArquivo}
                />

                <Input
                label="Nome do arquivo"
                placeholder="Ex.: Lista de exercícios"
                value={titulo}
                onChangeText={setTitulo}
                maxLength={LIMITE_TITULO}
                editable={!enviando}
                />

                <TextArea
                label="Descrição (opcional)"
                value={descricao}
                onChangeText={setDescricao}
                editable={!enviando}
                />

                <Button title="Anexar" titleLoading="Enviando..." loading={enviando} onPress={handleAnexar} />
            </Card>
        )
    }

    function vazio(){
        if(carregando) return <Loader />;
        if(!dados) return <ErrorState message={getErrorMessage(erro)} onRetry={tentarNovamente} />;

        return <EmptyState title="Você ainda não anexou materiais nesta sala." />;
    }

    return (
        <View style={styles.container}>
            <Header title="Materiais da sala" onBack={navigation.goBack} />

            <EvitarTeclado style={styles.container}>
                <FlatList
                {...rolagem}
                ref={listaRef}
                data={carregando ? [] : dados?.materiais ?? []}
                keyExtractor={(item) => String(item.id_material)}
                renderItem={({ item }) => <ItemMaterial material={item} detalhe={detalhe(item)} />}
                contentContainerStyle={styles.lista}
                ItemSeparatorComponent={() => <View style={styles.separador} />}
                ListHeaderComponent={
                    <View style={styles.topo}>
                        {formulario()}
                        <Text style={styles.titulo} accessibilityRole="header">Materiais · Sala {nome_sala}</Text>
                    </View>
                }
                ListEmptyComponent={vazio()}
                refreshControl={
                    <RefreshControl refreshing={atualizando} onRefresh={atualizar} colors={[colors.red700]} tintColor={colors.red700} />
                }
                />
            </EvitarTeclado>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.white
    },
    lista:{
        flexGrow: 1,
        padding: spacing.lg
    },
    topo:{
        gap: spacing.lg,
        marginBottom: spacing.md
    },
    separador:{
        height: spacing.md
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    aviso:{
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.gray700
    }
})
