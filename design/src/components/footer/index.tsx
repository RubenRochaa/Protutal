import styles from './styles.module.scss'
import Link from 'next/link'
import { CircleQuestionMark, FolderGit2, Mail, MessageCircle, MessageSquareHeart } from 'lucide-react'
import {
    AJUDA_URL,
    EMAIL_SUPORTE,
    EMAIL_SUPORTE_URL,
    FORM_MELHORIA_URL,
    GITHUB_URL,
    IDENTIFICACAO,
    WHATSAPP_TEXTO,
    WHATSAPP_URL
} from './footerLinks'

// Links externos abrem em nova aba. O "noopener noreferrer" impede que a página aberta
// controle a aba do Protutal
const EXTERNO = { target: "_blank", rel: "noopener noreferrer" }

// Rodapé das telas logadas (professor, aluno, tutor e ajuda).
// Não é fixo: fica depois do conteúdo. Quem o encosta no fim da janela é o AreaComRodape
export function Footer(){
    return (
        <footer className={styles.rodape}>
            <div className={styles.container}>
                <p className={styles.identificacao}>{IDENTIFICACAO}</p>

                <address className={styles.bloco}>
                    <a href={EMAIL_SUPORTE_URL} className={`${styles.link} link-texto`}>
                        <Mail size={16} aria-hidden="true" />
                        {EMAIL_SUPORTE}
                    </a>

                    <a href={WHATSAPP_URL} {...EXTERNO} className={`${styles.link} link-texto`}>
                        <MessageCircle size={16} aria-hidden="true" />
                        WhatsApp {WHATSAPP_TEXTO}
                    </a>
                </address>

                <nav aria-label="Links do rodapé" className={styles.bloco}>
                    <Link href={AJUDA_URL} className={`${styles.link} link-texto`}>
                        <CircleQuestionMark size={16} aria-hidden="true" />
                        Perguntas frequentes
                    </Link>

                    <a href={GITHUB_URL} {...EXTERNO} className={`${styles.link} link-texto`}>
                        <FolderGit2 size={16} aria-hidden="true" />
                        Repositório no GitHub
                    </a>

                    <a href={FORM_MELHORIA_URL} {...EXTERNO} className={`${styles.link} link-texto`}>
                        <MessageSquareHeart size={16} aria-hidden="true" />
                        Nos ajude a melhorar
                    </a>
                </nav>
            </div>
        </footer>
    )
}
