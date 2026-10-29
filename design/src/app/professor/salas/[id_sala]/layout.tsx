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
import { PermissaoAtividades } from './components/permissaoAtividades'
import { getAutenticado } from '@/lib/apiServer'
import { TutorSala } from '@/lib/types'

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
    // A P24 (tutores ativos) dá o estado do interruptor de permissão (P29) no topo da sala
    const [resultado, tutores] = await Promise.all([
        buscarSala(id_sala),
        getAutenticado<TutorSala[]>(`/salas/${encodeURIComponent(id_sala)}/tutores`)
    ])

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

                    {/* Permissão de criar atividades (P29). Se a P24 falhar, o interruptor
                        não aparece: a aba aberta já mostra o erro de carregamento */}
                    <div className={styles.acoes}>
                        {"dados" in tutores && <PermissaoAtividades idSala={sala.id_sala} tutores={tutores.dados} />}
                    </div>
                </div>

                <AbasSala idSala={sala.id_sala} />

                {children}
            </div>
        </main>
    )
}
