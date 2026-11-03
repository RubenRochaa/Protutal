import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, fonts, radius, spacing } from "../../styles/theme";

// Cada opção tem um valor (o que vai para a API) e o texto mostrado
export type OptionProps = {
    value: string | number;
    label: string;
}

interface ModalPickerProps{
    options: OptionProps[];
    handleCloseModal: () => void;
    selectedItem: (item: OptionProps) => void;
    // Valor marcado no momento, para destacar na lista
    selectedValue?: string | number;
}

const { width: WIDTH, height: HEIGHT } = Dimensions.get("window")

// Lista de opções para usar dentro de um <Modal transparent>, no padrão do exemplo.
// Tocar fora da lista fecha o modal.
export function ModalPicker({ options, handleCloseModal, selectedItem, selectedValue }: ModalPickerProps){

    function onPressItem(item: OptionProps){
        selectedItem(item);
        handleCloseModal();
    }

    const option = options.map((item) => {
        const selecionado = item.value === selectedValue;

        return (
            <TouchableOpacity
            key={item.value}
            style={styles.option}
            onPress={() => onPressItem(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: selecionado }}
            >
                <Text style={[styles.item, selecionado && styles.itemSelecionado]}>
                    {item.label}
                </Text>

                {selecionado && <Feather name="check" size={18} color={colors.red700} />}
            </TouchableOpacity>
        )
    })

    return(
        <TouchableOpacity style={styles.container} onPress={handleCloseModal} activeOpacity={1}>
            <View style={styles.content}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {option}
                </ScrollView>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)"
    },
    content:{
        width: WIDTH - 40,
        maxHeight: HEIGHT / 2,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.gray300,
        borderRadius: radius.cardSm,
        overflow: "hidden"
    },
    option:{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300
    },
    item:{
        flex: 1,
        marginVertical: spacing.lg,
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.black
    },
    itemSelecionado:{
        color: colors.red700
    }
})
