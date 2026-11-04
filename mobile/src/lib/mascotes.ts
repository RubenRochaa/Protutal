import { ImageSourcePropType } from 'react-native'

// Imagens do mascote do Protutal, as mesmas do site (design/public/img)
export const MASCOTES = {
    telaInicial: require('../assets/mascote_protutal_telaInicial.png'),
    areasVazias: require('../assets/mascote_protutal_areasVazias.png'),
    atividades: require('../assets/mascote_protutal_atividades.png'),
    desempenho: require('../assets/mascote_protutal_desempenho.png'),
    badRequest: require('../assets/mascote_protutal_badRequest.png'),
    goodRequest: require('../assets/mascote_protutal_goodRequest.png'),
    email: require('../assets/mascote_protutal_email.png'),
} satisfies Record<string, ImageSourcePropType>

export const LOGO: ImageSourcePropType = require('../assets/logo.png')
export const LOGO_MODO_ESCURO: ImageSourcePropType = require('../assets/logo_modoEscuro.png')
