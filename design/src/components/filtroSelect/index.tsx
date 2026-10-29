"use client"

import styles from './styles.module.scss'
import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Select } from '../select'

interface Props {
    // Nome do parâmetro na URL (ex.: "id_aluno" -> ?id_aluno=15)
    parametro: string;
    label: string;
    // A primeira opção deve ter valor "" (sem filtro, ex.: "Todos os alunos")
    opcoes: { valor: string; rotulo: string }[];
    // Valor atual, já validado pela página
    valor: string;
}

// Filtro em select que só muda a URL (como o FiltroAbas, para listas com muitas opções).
// Quem chama a API com o filtro é a página, no servidor. Os outros parâmetros são mantidos.
export function FiltroSelect({ parametro, label, opcoes, valor }: Props){
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [carregando, startTransition] = useTransition();

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>){
        const params = new URLSearchParams(searchParams.toString());

        if(e.target.value) params.set(parametro, e.target.value);
        else params.delete(parametro);

        const query = params.toString();
        startTransition(() => {
            router.push(query ? `${pathname}?${query}` : pathname);
        });
    }

    return (
        <div className={styles.filtro}>
            <Select
            label={label}
            name={`filtro_${parametro}`}
            opcoes={opcoes}
            value={valor}
            onChange={handleChange}
            disabled={carregando}
            />
        </div>
    )
}
