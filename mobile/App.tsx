import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';

import Routes from './src/routes';
import { Loader } from './src/components/Loader';

import { AuthProvider } from './src/contexts/AuthContext';
import { AcessibilidadeContext, AcessibilidadeProvider } from './src/contexts/AcessibilidadeContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { useTema } from './src/lib/useTema';
import { useContext } from 'react';

// A tela de carregamento nativa fica até as fontes e as preferências de acessibilidade
// estarem prontas: assim o app não abre piscando com o tema errado
SplashScreen.preventAutoHideAsync().catch(() => {});

function Aplicativo() {
  const { carregado } = useContext(AcessibilidadeContext);
  const { tema, colors } = useTema();

  // Poppins, a mesma fonte do site
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
  });

  const pronto = fontsLoaded && carregado;

  useEffect(() => {
    if(pronto) SplashScreen.hideAsync().catch(() => {});
  }, [pronto]);

  // Fundo, cartões e bordas da navegação seguem o tema
  const temaNavegacao: Theme = useMemo(() => ({
    ...DefaultTheme,
    dark: tema === 'escuro',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.red700,
      background: colors.fundoPagina,
      card: colors.white,
      text: colors.black,
      border: colors.gray300,
      notification: colors.destaque
    }
  }), [tema, colors]);

  if(!pronto){
    return (
      <View style={[styles.loading, { backgroundColor: colors.destaque }]}>
        <Loader size="grande" variant="branco" />
      </View>
    )
  }

  // O ToastProvider fica por fora do AuthProvider: o login e a sessão expirada usam o toast
  return (
    <NavigationContainer theme={temaNavegacao}>
      <ToastProvider>
        <AuthProvider>
          {/* Texto claro. O fundo vermelho atrás da barra vem do Header/AuthLayout (insets.top),
              que é um vermelho escuro em todos os temas */}
          <StatusBar style='light'/>
          <Routes/>
        </AuthProvider>
      </ToastProvider>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AcessibilidadeProvider>
        <Aplicativo />
      </AcessibilidadeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
