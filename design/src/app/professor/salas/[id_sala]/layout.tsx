import styles from './layout.module.scss'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { PageBanner } from '@/components/pageBanner'
import { ErroCarregamento } from '../../components/erroCarregamento'
import { buscarSala } from './buscarSala'
import { AbasSala } from './components/abasSala'
import { SalaIndisponivel } from './components/salaIndisponivel'

interface Props {
    children: React.ReactNode;
    params: Promise<{ id_sala: string }>;
}

// Respostas da P1 que significam "esta sala não pode ser aberta":
// 400 (id inválido), 403 (sala de outro professor) e 404 (sala não existe)
const SALA_INDISPONIVEL = [400, 403, 404]

// Moldura de todas as abas da sala: busca a P1 uma vez e mostra o banner,
// a barra com o botão de voltar e as abas. Cada aba (page.tsx) aparece em "children".
export default async function SalaLayout({ children, params }: Props){
    const { id_sala } = await params
    const resultado = await buscarSala(id_sala)

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        const status = getErrorStatus(resultado.erro)
        const mensagem = getErrorMessage(resultado.erro)

        return (
            <main>
                <PageBanner titulo="Detalhes da sala" />

                <div className={styles.conteudo}>
                    {status !== null && SALA_INDISPONIVEL.includes(status)
                        ? <SalaIndisponivel mensagem={mensagem} />
                        : <ErroCarregamento mensagem={mensagem} />
                    }
                </div>
            </main>
        )
    }

    const { sala } = resultado

    return (
        <main>
            <PageBanner titulo={`Detalhes ${sala.nome}`} />

            <div className={styles.conteudo}>
                <div className={styles.barra}>
                    <Link href="/professor#salas" className={styles.voltar}>
                        <ArrowLeft size={20} aria-hidden="true" />
                        Minhas salas
                    </Link>

                    <span className={styles.info}>
                        {sala.serie}ª série · {sala.ano_letivo}
                    </span>

                    {/* Espaço reservado: permissão de criar atividades (P29), lote A3 */}
                    <div className={styles.acoes} />
                </div>

                <AbasSala idSala={sala.id_sala} />

                {children}
            </div>
        </main>
    )
}
