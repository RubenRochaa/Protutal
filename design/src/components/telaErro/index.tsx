import styles from './styles.module.scss'
import { Card } from '../card'
import { Mascote } from '../mascote'
import { PageBanner } from '../pageBanner'
import { ImagemMascote, MASCOTES } from '@/lib/mascotes'

interface QuadroProps {
    mensagem: string;
    // Botões e links da tela (Botao do projeto)
    children: React.ReactNode;
    // Padrão: mascote com o papel com X (badRequest)
    imagem?: ImagemMascote;
}

// Quadro branco de erro: mascote grande, mensagem e botões.
// Use sozinho quando a tela já tem a faixa vermelha (ex.: layout da sala do professor)
export function QuadroErro({ mensagem, children, imagem = MASCOTES.badRequest }: QuadroProps){
    return (
        <div className={styles.quadro} role="alert">
            <Mascote imagem={imagem} className={styles.imagem} />
            <p className={styles.mensagem}>{mensagem}</p>
            <div className={styles.acoes}>{children}</div>
        </div>
    )
}

interface TelaProps extends QuadroProps {
    titulo: string;
}

// Tela de erro de página inteira (404, "Algo deu errado", acesso negado):
// faixa vermelha com o título e o cartão cinza com o QuadroErro.
// Não mostra detalhes técnicos: a mensagem é sempre um texto amigável
export function TelaErro({ titulo, ...quadro }: TelaProps){
    return (
        <main>
            <PageBanner titulo={titulo} />

            <div className={styles.conteudo}>
                <Card>
                    <QuadroErro {...quadro} />
                </Card>
            </div>
        </main>
    )
}
