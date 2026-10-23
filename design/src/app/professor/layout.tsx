import { Header } from '@/components/header'

// Menu do professor. "Tutoria" leva aos pedidos de tutoria (tela ainda a criar).
// "Desempenho" ainda não tem rota na API: fica desabilitado com "Em breve".
const LINKS = [
    { label: "Início", href: "/professor" },
    { label: "Tutoria", href: "/professor/pedidos" },
    { label: "Desempenho", href: "", emBreve: true },
]

export default function ProfessorLayout({ children }: { children: React.ReactNode }){
    return (
        <>
            <Header links={LINKS} />
            {children}
        </>
    )
}
