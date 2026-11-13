import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";

import { MaterialSala } from "../../lib/types";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, shadows, spacing } from "../../styles/theme";

interface ItemMaterialProps {
    material: MaterialSala;
    // Linha de baixo, depois do tipo do arquivo (ex.: "Enviado por Ana em 10/09/2026")
    detalhe: string;
}

// Ícone pelo tipo do arquivo (a API só aceita .pdf .doc .docx .xls .xlsx .csv)
function iconeMaterial(url: string): { nome: React.ComponentProps<typeof Feather>["name"]; rotulo: string } {
    const extensao = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";

    if(extensao === "pdf") return { nome: "file-text", rotulo: "PDF" };
    if(extensao === "doc" || extensao === "docx") return { nome: "file-text", rotulo: extensao.toUpperCase() };
    if(extensao === "xls" || extensao === "xlsx" || extensao === "csv") return { nome: "grid", rotulo: extensao.toUpperCase() };

    return { nome: "file", rotulo: "Arquivo" };
}

// Material de apoio da sala (rota A5): tocar abre o arquivo no navegador do celular
export function ItemMaterial({ material, detalhe }: ItemMaterialProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const { colors } = temaAtual;
    const icone = iconeMaterial(material.arquivo);
    // Materiais antigos (do seed) guardam um caminho local em vez da URL: não há o que abrir (igual ao site)
    const linkWeb = /^https?:\/\//i.test(material.arquivo);

    return (
        <TouchableOpacity
        style={styles.material}
        onPress={() => Linking.openURL(material.arquivo)}
        disabled={!linkWeb}
        accessibilityRole="link"
        accessibilityLabel={linkWeb ? `Abrir ${material.titulo}` : `${material.titulo}: arquivo indisponível`}
        >
            <View style={styles.icone}>
                <Feather name={icone.nome} size={22} color={colors.textoSobreDestaque} />
            </View>

            <View style={styles.dados}>
                <Text style={styles.titulo}>{material.titulo}</Text>
                {material.descricao && <Text style={styles.texto}>{material.descricao}</Text>}
                <Text style={styles.textoSecundario}>{icone.rotulo} · {detalhe}</Text>
                {!linkWeb && <Text style={styles.textoSecundario}>Arquivo indisponível</Text>}
            </View>

            {linkWeb && <Feather name="download" size={22} color={colors.red700} />}
        </TouchableOpacity>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    material:{
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
    icone:{
        width: 44,
        height: 44,
        borderRadius: radius.item,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.destaque
    },
    dados:{
        flex: 1,
        gap: 2
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fs(15),
        color: colors.black
    },
    texto:{
        fontFamily: fonts.regular,
        fontSize: fs(14),
        color: colors.black
    },
    textoSecundario:{
        fontFamily: fonts.regular,
        fontSize: fs(13),
        color: colors.gray700
    }
})
