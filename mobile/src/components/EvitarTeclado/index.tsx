import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollResponderType,
    ScrollView,
    ScrollViewInstance,
    ScrollViewProps,
    StyleProp,
    TextInput,
    ViewStyle
} from "react-native";

// Espaço livre entre o campo em foco e o topo do teclado
const MARGEM = 24;

// Tempo para o KeyboardAvoidingView aplicar o padding antes de medir
const ESPERA = 150;

interface EvitarTecladoProps {
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}

// No SDK 58 o Android é edge-to-edge: a janela não encolhe mais com o teclado (o antigo adjustResize).
// Por isso o behavior "padding" vale também no Android: o conteúdo ganha um espaço embaixo do
// tamanho do teclado e o que está no fim da coluna (barra do chat, rodapé do modal) sobe junto
export function EvitarTeclado({ style, children }: EvitarTecladoProps){
    return (
        <KeyboardAvoidingView style={style} behavior="padding">
            {children}
        </KeyboardAvoidingView>
    )
}

// Rola a lista até o campo em foco quando o teclado abre ou quando o usuário toca em outro campo
// com o teclado aberto. Serve para ScrollView e FlatList (as duas têm getScrollResponder)
export function useRolarAteCampo(obterRolagem: () => ScrollResponderType | null | undefined){
    const deslocamento = useRef(0);

    const rolar = useCallback(() => {
        const rolagem = obterRolagem();
        const campo = TextInput.State.currentlyFocusedInput();
        const teclado = Keyboard.metrics();
        const conteudo = rolagem?.getInnerViewRef();
        const nativa = rolagem?.getNativeScrollRef();

        if(!rolagem || !campo || !teclado || !conteudo || !nativa) return;

        // Posição do campo dentro do conteúdo. Se o campo não estiver nesta rolagem (ex.: está
        // num modal aberto por cima), a medida falha e nada acontece
        campo.measureLayout(conteudo, (_x, campoY, _largura, campoAltura) => {
            nativa.measureInWindow((_rx: number, rolagemY: number, _rLargura: number, rolagemAltura: number) => {
                // Parte visível: do topo da rolagem até o que vier primeiro, o fim dela ou o teclado
                const fimVisivel = Math.min(rolagemY + rolagemAltura, teclado.screenY);
                const alturaVisivel = fimVisivel - rolagemY;
                const atual = deslocamento.current;

                if(campoY + campoAltura + MARGEM > atual + alturaVisivel){
                    rolagem.scrollTo({ y: campoY + campoAltura + MARGEM - alturaVisivel, animated: true });
                } else if(campoY - MARGEM < atual){
                    rolagem.scrollTo({ y: Math.max(0, campoY - MARGEM), animated: true });
                }
            });
        }, () => {});
    }, [obterRolagem])

    useEffect(() => {
        let espera: ReturnType<typeof setTimeout> | undefined;

        const assinatura = Keyboard.addListener("keyboardDidShow", () => {
            espera = setTimeout(rolar, ESPERA);
        });

        return () => {
            assinatura.remove();
            clearTimeout(espera);
        }
    }, [rolar])

    // Props que vão na ScrollView/FlatList
    return {
        scrollEventThrottle: 16,
        onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            deslocamento.current = event.nativeEvent.contentOffset.y;
        },
        // Trocou de campo com o teclado já aberto: o keyboardDidShow não dispara de novo
        onTouchEnd: () => {
            if(Keyboard.isVisible()) setTimeout(rolar, ESPERA);
        },
        keyboardShouldPersistTaps: "handled" as const
    }
}

// ScrollView dos formulários: rola sozinha até o campo em foco e, com keyboardShouldPersistTaps="handled",
// o toque num botão com o teclado aberto funciona de primeira
export function RolagemTeclado(props: ScrollViewProps){
    const ref = useRef<ScrollViewInstance>(null);
    const obterRolagem = useCallback(() => ref.current?.getScrollResponder(), []);
    const rolagem = useRolarAteCampo(obterRolagem);

    return <ScrollView {...rolagem} {...props} ref={ref} />;
}
