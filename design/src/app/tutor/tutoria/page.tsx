import pagina from '../pagina.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { Botao } from '@/components/botao'
import { PageBanner } from '@/components/pageBanner'
import { FiltroAbas } from '@/components/filtroAbas'
import { ListaTutorados } from './components/listaTutorados'
import { MateriaisSala } from './components/materiaisSala'

interface Props {
    searchParams: Promise<{ status?: string | string[] }>;
}

// Na URL: sem ?status= = Ativas (padrão); "finalizada"; "todas" (a T1 sem filtro)
const OPCOES_STATUS = [
    { valor: "", rotulo: "Ativas" },
    { valor: "finalizada", rotulo: "Finalizadas" },
    { valor: "todas", rotulo: "Todas" },
]

// Tela "Tutoria" do tutor (print 2): à esquerda, os tutorados (T1) com o chat;
// à direita, "Anexar materiais" (T5) e os materiais anexados por sala (A5)
export default async function TutoriaTutorPage({ searchParams }: Props){
    const { status } = await searchParams
    const filtro = status === "finalizada" || status === "todas" ? status : ""

    // Valor que vai para a T1 ("" = todas)
    const statusApi = filtro === "" ? "ativa" : filtro === "finalizada" ? "finalizada" : ""

    return (
        <main>
            <PageBanner titulo="Tutoria" />

            <div className={pagina.conteudo}>
                <div className={lista.topo}>
                    <FiltroAbas parametro="status" opcoes={OPCOES_STATUS} valor={filtro} rotulo="Filtrar tutorias por situação" />

                    <Botao href="/tutor/atividades/nova">
                        <Plus size={18} aria-hidden="true" /> Nova atividade
                    </Botao>
                </div>

                <div className={lista.duasColunas}>
                    {/* key: ao trocar o filtro, mostra o Loading de novo enquanto busca */}
                    <Suspense key={filtro} fallback={<Card titulo="Converse com os seus tutorados" sublinhado><Loading /></Card>}>
                        <ListaTutorados status={statusApi} />
                    </Suspense>

                    <Suspense fallback={<Card titulo="Anexar materiais" sublinhado><Loading /></Card>}>
                        <MateriaisSala />
                    </Suspense>
                </div>
            </div>
        </main>
    )
}
