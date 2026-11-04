import React, { useCallback, useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { Select } from "../../../components/Select";
import { Loader } from "../../../components/Loader";
import { TextArea } from "../../../components/TextArea";
import { EmptyState } from "../../../components/EmptyState";
import { ErrorState } from "../../../components/ErrorState";
import { CampoDataHora } from "../../../components/CampoDataHora";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { ConteudoSala, TipoAtividadeOpcao, TutoriaTutor } from "../../../lib/types";
import { TutorScreenProps } from "../../../routes/tutor.routes";
import { colors, fonts, radius, spacing } from "../../../styles/theme";

const LIMITE_TITULO = 150;

// Resposta da T9 quando o professor não deu a permissão (pode_criar_ativ = false)
const MSG_SEM_PERMISSAO = "O professor não liberou a criação de atividades";

const ETAPAS = [
    { value: "1", label: "1ª etapa" },
    { value: "2", label: "2ª etapa" },
    { value: "3", label: "3ª etapa" },
]

interface Base {
    tutorias: TutoriaTutor[];
    tipos: TipoAtividadeOpcao[];
}

// Tela "Criar atividade" (layout do Figma, campos e regras do site em /tutor/atividades/nova).
// Passo 1: o tutorado que recebe a atividade (T1 ativas): a T9 aceita um destinatário por atividade.
// Passo 2: nome, conteúdo da sala (P2), tipo (T8), etapa, prazo e descrição. Envio: T9 (JSON)
export default function NovaAtividade({ navigation, route }: TutorScreenProps<"NovaAtividade">){
    const { showToast } = useContext(ToastContext);

    const [idTutoria, setIdTutoria] = useState(route.params?.id_tutoria ? String(route.params.id_tutoria) : "");
    const [titulo, setTitulo] = useState("");
    const [idConteudo, setIdConteudo] = useState("");
    const [tipo, setTipo] = useState("");
    const [etapa, setEtapa] = useState("");
    const [prazo, setPrazo] = useState<Date | null>(null);
    const [descricao, setDescricao] = useState("");
    const [semPermissao, setSemPermissao] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const buscarBase = useCallback(async (): Promise<Base> => {
        const [tutorias, tipos] = await Promise.all([
            api.get<TutoriaTutor[]>("/tutores/me/tutorias", { params: { status: "ativa" } }).then((r) => r.data),
            api.get<TipoAtividadeOpcao[]>("/tipos-atividade").then((r) => r.data)
        ]);

        return { tutorias, tipos };
    }, [])

    const base = useBuscar(buscarBase);
    const tutoria = base.dados?.tutorias.find((item) => String(item.id_tutoria) === idTutoria) ?? null;
    const idSala = tutoria?.sala.id_sala ?? null;

    // Conteúdos da sala do tutorado escolhido (P2); sem tutorado, nada a buscar
    const buscarConteudos = useCallback(async () => {
        if(idSala === null) return [];

        return (await api.get<ConteudoSala[]>(`/salas/${idSala}/conteudos`)).data;
    }, [idSala])

    const conteudos = useBuscar(buscarConteudos);

    function escolherTutorado(valor: string){
        setIdTutoria(valor);
        // O conteúdo é da sala: troca de tutorado pode trocar a sala
        setIdConteudo("");
        setSemPermissao(false);
    }

    // Mesmas validações e mensagens do site antes da rota T9
    function validar(): string | null {
        if(!idConteudo) return "Escolha o conteúdo da atividade.";
        if(titulo.trim() === "") return "O campo titulo é obrigatório";
        if(titulo.trim().length > LIMITE_TITULO) return "O titulo deve ter no máximo 150 caracteres";
        if(!tipo) return "Escolha o tipo da atividade.";
        if(!etapa) return "Escolha a etapa.";
        if(!prazo) return "O campo prazo é obrigatório";
        if(prazo.getTime() <= Date.now()) return "O prazo deve ser uma data futura";

        return null;
    }

    async function handleEnviar(){
        const mensagemErro = validar();

        if(mensagemErro || !tutoria || !prazo){
            showToast("erro", mensagemErro ?? "Escolha o tutorado que vai receber a atividade.");
            return;
        }

        setEnviando(true);
        setSemPermissao(false);

        try {
            const resposta = await api.post<{ id_atividade: number }>("/atividades", {
                id_tutoria: tutoria.id_tutoria,
                id_conteudo: Number(idConteudo),
                titulo: titulo.trim(),
                ...(descricao.trim() !== "" ? { descricao: descricao.trim() } : {}),
                tipo,
                etapa: Number(etapa),
                // O prazo escolhido no fuso do celular vai em ISO (UTC), como o site envia
                prazo: prazo.toISOString()
            });

            showToast("sucesso", "Atividade criada!");
            navigation.replace("CorrigirAtividade", { id_atividade: resposta.data.id_atividade });
        } catch(err) {
            const mensagem = getErrorMessage(err);

            if(mensagem === MSG_SEM_PERMISSAO) setSemPermissao(true);
            showToast("erro", mensagem);
        } finally {
            setEnviando(false);
        }
    }

    function formulario(){
        if(!tutoria) return <EmptyState title="Escolha o tutorado que vai receber a atividade." />;
        if(conteudos.carregando) return <Loader />;
        if(!conteudos.dados) return <ErrorState message={getErrorMessage(conteudos.erro)} onRetry={conteudos.tentarNovamente} />;
        if(conteudos.dados.length === 0) return <EmptyState title="O professor ainda não cadastrou conteúdos nesta sala." />;

        return (
            <>
                <Input
                label="Nome"
                placeholder="Insira o nome da atividade"
                value={titulo}
                onChangeText={setTitulo}
                maxLength={LIMITE_TITULO}
                editable={!enviando}
                />

                <Select
                label="Conteúdo"
                placeholder="Escolha o conteúdo"
                options={conteudos.dados.map((conteudo) => ({ value: String(conteudo.id_conteudo), label: conteudo.nome }))}
                value={idConteudo}
                onChange={setIdConteudo}
                disabled={enviando}
                />

                <Select
                label="Tipo"
                placeholder="Escolha o tipo"
                options={(base.dados?.tipos ?? []).map((opcao) => ({ value: opcao.valor, label: opcao.rotulo }))}
                value={tipo}
                onChange={setTipo}
                disabled={enviando}
                />

                <Select
                label="Etapa"
                placeholder="Escolha a etapa"
                options={ETAPAS}
                value={etapa}
                onChange={setEtapa}
                disabled={enviando}
                />

                <CampoDataHora label="Prazo de entrega" value={prazo} onChange={setPrazo} disabled={enviando} />

                <TextArea
                label="Descrição (opcional)"
                placeholder="Descreva o que o aluno deve fazer e, se necessário, inclua orientações."
                value={descricao}
                onChangeText={setDescricao}
                editable={!enviando}
                />

                {semPermissao && (
                    <View style={styles.alerta} accessibilityRole="alert">
                        <Feather name="alert-triangle" size={20} color={colors.red700} />
                        <Text style={styles.textoAlerta}>
                            O professor não liberou a criação de atividades nesta sala. Fale com ele para liberar.
                        </Text>
                    </View>
                )}

                <Button title="Enviar" titleLoading="Enviando..." loading={enviando} onPress={handleEnviar} />
                <Button title="Cancelar" variant="secundario" onPress={navigation.goBack} disabled={enviando} />
            </>
        )
    }

    function conteudo(){
        if(base.carregando) return <Loader />;
        if(!base.dados) return <ErrorState message={getErrorMessage(base.erro)} onRetry={base.tentarNovamente} />;

        if(base.dados.tutorias.length === 0){
            return <EmptyState title="Você não tem tutorados ativos para receber atividades." />;
        }

        return (
            <>
                <View style={styles.info}>
                    <Feather name="info" size={20} color={colors.gray700} />
                    <Text style={styles.textoInfo}>
                        Para enviar atividades é preciso a permissão do professor da sala.
                    </Text>
                </View>

                <Card title="Tutorado">
                    <Select
                    label="Tutorado"
                    placeholder="Escolha o tutorado"
                    options={base.dados.tutorias.map((item) => ({
                        value: String(item.id_tutoria),
                        label: `${item.aluno.nome} · Sala ${item.sala.nome}`
                    }))}
                    value={idTutoria}
                    onChange={escolherTutorado}
                    disabled={enviando}
                    />
                </Card>

                <Card title="Atividade">
                    {formulario()}
                </Card>
            </>
        )
    }

    return (
        <View style={styles.container}>
            <Header title="Criar atividade" onBack={navigation.goBack} />

            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
                    {conteudo()}
                </ScrollView>
            </KeyboardAvoidingView>
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
    info:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.card,
        backgroundColor: colors.gray100
    },
    textoInfo:{
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.black
    },
    alerta:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.red700,
        borderRadius: radius.item
    },
    textoAlerta:{
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.red700
    }
})
