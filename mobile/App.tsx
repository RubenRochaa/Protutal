import { View, StatusBar, StyleSheet } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
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
import { ToastProvider } from './src/contexts/ToastContext';
import { colors } from './src/styles/theme';

export default function App() {
  // Poppins, a mesma fonte do site
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
  });

  if(!fontsLoaded){
    return (
      <View style={styles.loading}>
        <Loader size="grande" variant="branco" />
      </View>
    )
  }

  // O ToastProvider fica por fora do AuthProvider: o login e a sessão expirada usam o toast
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ToastProvider>
          <AuthProvider>
            <StatusBar backgroundColor={colors.red700} barStyle='light-content' translucent={false}/>
            <Routes/>
          </AuthProvider>
        </ToastProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.red700,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
