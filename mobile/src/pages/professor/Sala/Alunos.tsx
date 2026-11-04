import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Avatar } from "../../../components/Avatar";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ListaSala } from "./ListaSala";
import { ModalMatricula } from "./ModalMatricula";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { AlunoSala } from "../../../lib/types";
import { colors, fonts, fontSizes, radius, shadows, spacing } from "../../../styles/theme";

// Turma > Alunos (site: alunos/components/listaAlunos): alunos matriculados (P23),
// "Ver atividades" e "Adicionar alunos" (P21 + P22).
// "Tornar tutor" do Figma não existe: o aluno só vira tutor pelo aceite do pedido (P27)
export function Alunos({ sala, cabecalho, irPara }: PropsAba){
    const [modalAberto, setModalAberto] = useState(false);

    const buscar = useCallback(async () => (await api.get<AlunoSala[]>(`/salas/${sala.id_sala}/alunos`)).data, [sala.id_sala])
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    return (
        <>
            <ListaSala
            cabecalho={cabecalho}
            topo={
                <>
                    <View style={styles.acoes}>
                        <Button title="+ Adicionar alunos" style={styles.botao} onPress={() => setModalAberto(true)} />
                        <Button title="Ver atividades" variant="secundario" style={styles.botao} onPress={() => irPara("atividades")} />
                    </View>

                    {dados && <Text style={styles.titulo}>Alunos ({dados.length})</Text>}
                </>
            }
            itens={dados ?? []}
            keyExtractor={(item) => String(item.id_aluno)}
            renderItem={({ item }) => (
                <View style={styles.item}>
                    <Avatar nome={item.nome} />
                    <View style={styles.dados}>
                        <Text style={styles.nome}>{item.nome}</Text>
                        <Text style={styles.email}>{item.email}</Text>
                        {!item.email_confirmado && <Badge label="e-mail não confirmado" />}
                    </View>
                </View>
            )}
            carregando={carregando}
            atualizando={atualizando}
            falhou={!dados}
            erro={erro}
            onAtualizar={atualizar}
            onTentarNovamente={tentarNovamente}
            vazio={`Nenhum aluno matriculado nesta sala. Toque em "Adicionar alunos" para matricular.`}
            />

            <ModalMatricula
            idSala={sala.id_sala}
            visivel={modalAberto}
            matriculados={(dados ?? []).map((aluno) => aluno.id_aluno)}
            onClose={() => setModalAberto(false)}
            onMatriculado={atualizar}
            />
        </>
    )
}

const styles = StyleSheet.create({
    acoes:{
        flexDirection: "row",
        gap: spacing.md
    },
    // Dois botões lado a lado: divide a linha em vez dos 100% do Button
    botao:{
        flex: 1,
        width: "auto",
        paddingHorizontal: spacing.sm
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    item:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        backgroundColor: colors.white,
        ...shadows.cardLeve
    },
    dados:{
        flex: 1,
        gap: 2
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    email:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    }
})
