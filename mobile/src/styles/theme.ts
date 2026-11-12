// Cores e medidas do site (design/src/app/globals.scss), convertidas para o React Native.
// rem do site = 16 px. Nenhuma tela deve repetir estes valores: use sempre o tema.

// Acessibilidade (RNF13, RNF14, RNF15, RNF19): mesmos níveis e preferências do site
export const CHAVE_ACESSIBILIDADE = 'protutal-acessibilidade'
export const NIVEIS_FONTE = [90, 100, 115, 130, 150]
export const NIVEL_FONTE_PADRAO = 1

export type Tema = 'claro' | 'escuro'

export interface Preferencias {
    nivelFonte: number   // índice em NIVEIS_FONTE
    tema: Tema
    daltonico: boolean
}

export const PREFERENCIAS_PADRAO: Preferencias = {
    nivelFonte: NIVEL_FONTE_PADRAO,
    tema: 'claro',
    daltonico: false,
}

// Cores do tema atual: claro, escuro e as variações do modo daltônico (azul no lugar do verde).
// Os nomes seguem as variáveis do globals.scss do site.
export function criarCores(tema: Tema, daltonico: boolean){
    const escuro = tema === 'escuro'

    const base = escuro
        ? {
            fundoPagina: '#121212',
            white: '#1E1E1E',
            black: '#EDEDED',
            red700: '#FF6B6B',
            red900: '#FF8A8A',
            destaque: '#C62828',
            destaqueHover: '#9E1B1B',
            sucessoIcone: '#4CD964',
            gray100: '#2A2A2A',
            gray300: '#333333',
            gray500: '#9E9E9E',
            gray700: '#BDBDBD',
            borderInput: '#6B6B6B',
        }
        : {
            fundoPagina: '#FFF',
            white: '#FFF',
            black: '#000',
            red700: '#C00000',   // botões, aba ativa, links
            red900: '#8B0000',   // botão pressionado (hover no site)
            destaque: '#C00000',
            destaqueHover: '#8B0000',
            sucessoIcone: '#1A7F37',
            gray100: '#F5F5F5',
            gray300: '#D9D9D9',  // aba inativa, pílulas e bordas dos cards
            gray500: '#767676',  // bordas das pílulas e placeholder
            gray700: '#5C5C5C',  // textos secundários
            borderInput: '#8A8A8A',
        }

    // Não mudam no escuro (no site também não)
    const fixas = {
        textoSobreDestaque: '#FFF',
        textoSobreSucesso: '#000',
        redDark: '#3B2A2A',  // fim do degradê do painel lateral
        red500: '#E30A0A',   // início do degradê do banner das páginas
        wine800: '#6E2427',  // fim do degradê do banner das páginas
        sucesso: '#4CD964',  // ícone de atividade realizada
        overlay: 'rgba(0,0,0,0.4)',
    }

    const cores = { ...fixas, ...base }

    if(daltonico){
        cores.sucesso = '#64B5F6'
        if(escuro){
            cores.sucessoIcone = '#64B5F6'
            cores.red700 = '#FF9E9E'
            cores.red900 = '#FFB8B8'
            cores.destaque = '#B71C1C'
            cores.destaqueHover = '#8E1414'
            cores.red500 = '#B71C1C'
        }else{
            cores.sucessoIcone = '#1565C0'
            cores.red700 = '#A00000'
            cores.red900 = '#6E0000'
            cores.destaque = '#A00000'
            cores.destaqueHover = '#6E0000'
            cores.red500 = '#A00000'
        }
    }

    // Cores do aviso (toast), como o sonner do site
    const toast = escuro
        ? {
            sucessoFundo: daltonico ? '#0A1A2E' : '#001F10',
            sucessoBorda: daltonico ? '#163A63' : '#003D1C',
            sucessoTexto: daltonico ? '#7CC0FF' : '#59F3A6',
            erroFundo: '#2D0607',
            erroBorda: '#4D0408',
            erroTexto: '#FF9EA3',
        }
        : {
            sucessoFundo: daltonico ? '#E3F0FF' : '#ECFDF3',
            sucessoBorda: daltonico ? '#9CC8F5' : '#D3FDE4',
            sucessoTexto: daltonico ? '#0B5CAD' : '#1A7F37',
            erroFundo: '#FFF0F0',
            erroBorda: '#FFE0E1',
            erroTexto: daltonico ? '#A00000' : '#C00000',
        }

    return { ...cores, green500: cores.sucesso, toast }
}

export type Cores = ReturnType<typeof criarCores>

// Tema claro padrão. Fica para as telas ainda não migradas para o useTema (somem no fim da migração)
export const colors = criarCores('claro', false)

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

// Multiplica um tamanho de fonte pelo nível escolhido (90% a 150%).
// O Text do React Native ainda soma o tamanho de fonte do próprio celular.
export function escalar(valor: number, nivelFonte: number){
    return Math.round(valor * NIVEIS_FONTE[nivelFonte] / 100 * 10) / 10
}

export function escalarFontes(nivelFonte: number): typeof fontSizes {
    const resultado: Record<string, number> = {}
    for(const [nome, valor] of Object.entries(fontSizes)){
        resultado[nome] = escalar(valor, nivelFonte)
    }
    return resultado as typeof fontSizes
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
