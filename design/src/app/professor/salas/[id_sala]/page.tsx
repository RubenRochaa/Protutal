import { buscarSala } from './buscarSala'
import { ResumoSala } from './components/resumoSala'

interface Props {
    params: Promise<{ id_sala: string }>;
}

// Aba "Resumo" (página inicial da sala).
// Os erros da P1 já foram tratados no layout; aqui a busca reaproveita a mesma resposta (cache).
export default async function SalaPage({ params }: Props){
    const { id_sala } = await params
    const resultado = await buscarSala(id_sala)

    if("erro" in resultado) return null;

    return <ResumoSala sala={resultado.sala} />
}
