import { ResumoSala } from './components/resumoSala'

interface Props {
    params: Promise<{ id_sala: string }>;
}

// Aba "Visão geral" (página inicial da sala).
// Os erros da P1 já foram tratados no layout; cada indicador busca a sua rota.
export default async function SalaPage({ params }: Props){
    const { id_sala } = await params

    return <ResumoSala idSala={id_sala} />
}
