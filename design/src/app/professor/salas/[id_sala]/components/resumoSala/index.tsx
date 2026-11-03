import styles from './styles.module.scss'
import Link from 'next/link'
import { Suspense } from 'react'
import { getAutenticado, ResultadoGet } from '@/lib/apiServer'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { AlunoSala, AtividadeSala, Contestacao, PedidoTutoria, TutoriaSala } from '@/lib/types'
import { Card } from '@/components/card'
import { Loader } from '@/components/loader'
import { buscarTutores } from '../../buscarTutores'

interface Props {
    idSala: string;
}

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000

// Troca a lista da API pela quantidade (ou repassa o erro)
function contar<T>(resultado: ResultadoGet<T[]>, filtro?: (item: T) => boolean): ResultadoGet<number> {
    if("erro" in resultado) return resultado;

    return { dados: filtro ? resultado.dados.filter(filtro).length : resultado.dados.length }
}

// Atividades com prazo entre agora e daqui a 7 dias (P11 não filtra por data: o filtro é aqui)
async function contarAtividadesDaSemana(id: string){
    const resultado = await getAutenticado<AtividadeSala[]>(`/salas/${id}/atividades`)
    const agora = Date.now()

    return contar(resultado, (atividade) => {
        const prazo = new Date(atividade.data_entrega).getTime()
        return prazo >= agora && prazo <= agora + SETE_DIAS_MS
    })
}

// Aba "Visão geral": 6 indicadores, cada um é um link para a sub-aba com a lista completa.
// As 6 buscas começam juntas; cada indicador espera a sua dentro do próprio <Suspense>,
// então um que demora ou falha não segura nem derruba os outros.
export function ResumoSala({ idSala }: Props){
    const base = `/professor/salas/${idSala}`
    const id = encodeURIComponent(idSala)

    const alunos = getAutenticado<AlunoSala[]>(`/salas/${id}/alunos`).then((r) => contar(r))
    const tutores = buscarTutores(idSala).then((r) => contar(r))
    const tutorias = getAutenticado<TutoriaSala[]>(`/salas/${id}/tutorias`, { status: "ativa" }).then((r) => contar(r))
    // A P26 devolve os pedidos de TODAS as salas do professor: fica só esta (igual à aba Pedidos)
    const pedidos = getAutenticado<PedidoTutoria[]>("/pedidos-tutoria")
        .then((r) => contar(r, (pedido) => String(pedido.sala_pedido.id_sala) === idSala))
    const contestacoes = getAutenticado<Contestacao[]>("/contestacoes", { id_sala: idSala, status: "pendente" })
        .then((r) => contar(r))
    const atividades = contarAtividadesDaSemana(id)

    const indicadores = [
        { rotulo: "Alunos matriculados", href: `${base}/alunos`, valor: alunos },
        { rotulo: "Tutores ativos", href: `${base}/tutores`, valor: tutores },
        { rotulo: "Tutorias ativas", href: `${base}/tutorias`, valor: tutorias },
        { rotulo: "Pedidos de tutoria pendentes", href: `${base}/pedidos`, valor: pedidos, pedeAcao: true },
        { rotulo: "Contestações pendentes", href: `${base}/contestacoes`, valor: contestacoes, pedeAcao: true },
        { rotulo: "Atividades com prazo nos próximos 7 dias", href: `${base}/atividades`, valor: atividades },
    ]

    return (
        <ul className={styles.grade}>
            {indicadores.map((indicador) => (
                <li key={indicador.href}>
                    <Suspense fallback={
                        <CardIndicador rotulo={indicador.rotulo} href={indicador.href}>
                            <span className={styles.carregando}><Loader size="pequeno" /></span>
                        </CardIndicador>
                    }>
                        <Indicador {...indicador} />
                    </Suspense>
                </li>
            ))}
        </ul>
    )
}

interface IndicadorProps {
    rotulo: string;
    href: string;
    valor: Promise<ResultadoGet<number>>;
    // Pedidos e contestações: o número fica vermelho quando há algo esperando o professor
    pedeAcao?: boolean;
}

async function Indicador({ rotulo, href, valor, pedeAcao }: IndicadorProps){
    const resultado = await valor

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    if("erro" in resultado){
        return (
            <CardIndicador rotulo={rotulo} href={href}>
                <span className={styles.numero}>—</span>
                <span className={styles.erro}>Não foi possível carregar</span>
            </CardIndicador>
        )
    }

    const destaque = pedeAcao && resultado.dados > 0

    return (
        <CardIndicador rotulo={rotulo} href={href}>
            <span className={destaque ? styles.numeroDestaque : styles.numero}>{resultado.dados}</span>
        </CardIndicador>
    )
}

interface CardIndicadorProps {
    rotulo: string;
    href: string;
    children: React.ReactNode;
}

// Casca do indicador: o card inteiro é o link; o número (ou o carregando) vem em children
function CardIndicador({ rotulo, href, children }: CardIndicadorProps){
    return (
        <Link href={href} className={styles.link}>
            <Card className={styles.card}>
                {children}
                <span className={styles.rotulo}>{rotulo}</span>
            </Card>
        </Link>
    )
}
