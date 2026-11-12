import React, { useMemo } from "react";
import { Text, StyleSheet, Pressable, PressableProps } from "react-native";

import { Loader } from "../Loader";
import { Contador } from "../Contador";
import { useTema, type TemaAtual } from "../../lib/useTema";
import { fonts, radius, sizes, spacing } from "../../styles/theme";

interface ButtonProps extends Omit<PressableProps, "children"> {
    title: string;
    // Texto mostrado enquanto a ação roda (ex.: "Entrando...")
    titleLoading?: string;
    loading?: boolean;
    // "primario" = vermelho cheio; "secundario" = borda vermelha e fundo branco
    variant?: "primario" | "secundario";
    // Bolinha de notificação depois do título (ex.: mensagens novas no "Abrir chat")
    contador?: number;
}

// Botão do Protutal: mesmo tamanho, raio e cores do botão do site
export function Button({ title, titleLoading, loading = false, variant = "primario", disabled, style, contador, ...rest }: ButtonProps){
    const temaAtual = useTema();
    const styles = useMemo(() => makeStyles(temaAtual), [temaAtual]);
    const primario = variant === "primario";
    const desabilitado = !!disabled || loading;

    return (
        <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: desabilitado, busy: loading }}
        disabled={desabilitado}
        style={(estado) => [
            styles.button,
            primario ? styles.primario : styles.secundario,
            estado.pressed && (primario ? styles.primarioPressionado : styles.secundarioPressionado),
            desabilitado && styles.desabilitado,
            typeof style === "function" ? style(estado) : style
        ]}
        {...rest}
        >
            {loading && <Loader size="pequeno" variant={primario ? "branco" : "vermelho"} />}

            <Text style={[styles.texto, !primario && styles.textoSecundario]}>
                {loading && titleLoading ? titleLoading : title}
            </Text>

            {/* No botão vermelho a bolinha fica clara, como o "Abrir chat" do site */}
            <Contador valor={contador} claro={primario} />
        </Pressable>
    )
}

const makeStyles = ({ colors, fs }: TemaAtual) => StyleSheet.create({
    button:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        width: "100%",
        minHeight: sizes.botao,
        borderRadius: radius.input,
        paddingHorizontal: spacing.lg
    },
    primario:{
        backgroundColor: colors.destaque
    },
    primarioPressionado:{
        backgroundColor: colors.destaqueHover
    },
    secundario:{
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.red700
    },
    secundarioPressionado:{
        backgroundColor: colors.gray100
    },
    desabilitado:{
        opacity: 0.6
    },
    texto:{
        fontFamily: fonts.medium,
        fontSize: fs(16),
        color: colors.textoSobreDestaque
    },
    textoSecundario:{
        color: colors.red700
    }
})
