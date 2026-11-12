// Cores e medidas do site (design/src/app/globals.scss), convertidas para o React Native.
// rem do site = 16 px. Nenhuma tela deve repetir estes valores: use sempre o tema.

export const colors = {
    white: '#FFF',
    black: '#000',

    red700: '#C00000',   // botões, aba ativa, links
    red900: '#8B0000',   // botão pressionado (hover no site)
    redDark: '#3B2A2A',  // fim do degradê do painel lateral
    red500: '#E30A0A',   // início do degradê do banner das páginas
    wine800: '#6E2427',  // fim do degradê do banner das páginas

    green500: '#4CD964', // ícone de atividade realizada

    gray100: '#F5F5F5',
    gray300: '#D9D9D9',  // aba inativa, pílulas e bordas dos cards
    gray500: '#9E9E9E',  // bordas das pílulas e placeholder
    gray700: '#5C5C5C',  // textos secundários

    borderInput: '#CFCFCF',
}

// Poppins, a mesma fonte do Google usada no site (carregada no App.tsx)
export const fonts = {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
}

export const fontSizes = {
    base: 16,
    label: 14.4,        // rótulo dos campos (0.9rem)
    tituloCard: 16.8,   // título do Card (1.05rem)
    destaque: 20,       // texto em destaque dentro do card (1.25rem)
    acaoCard: 14.4,     // link no cabeçalho do Card (0.9rem)
    rotulo: 13.6,       // rótulo pequeno acima de um dado (0.85rem)
    indicador: 32,      // número grande dos indicadores (2rem)
    selo: 12,           // selo do tipo de conta e etiquetas (0.75rem)
    aba: 11,            // rótulo das abas inferiores
}

export const radius = {
    card: 16,
    cardSm: 12, // componente Card
    item: 8,    // itens de lista com borda dentro dos cards
    input: 6,   // inputs e botões
    pill: 999,
}

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
}

// Medidas fixas de componentes do site
export const sizes = {
    botao: 44,
    input: 40,
    alturaSelo: 22,
    larguraSelo: 72,
}

// box-shadow do site convertido: shadow* vale no iOS e elevation no Android
export const shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 6,
    },
    cardLeve: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 1,
    },
}
