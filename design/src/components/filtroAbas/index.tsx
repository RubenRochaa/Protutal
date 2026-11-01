"use client"

import styles from './styles.module.scss'
import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface Opcao {
    // Valor que vai na URL ("" = sem filtro, ex.: "Todas")
    valor: string;
    rotulo: string;
}

interface Props {
    // Nome do parâmetro na URL (ex.: "status" -> ?status=ativa)
    parametro: string;
    opcoes: Opcao[];
    // Valor atual, já validado pela página ("" = sem filtro)
    valor: string;
    // Texto para leitor de tela (ex.: "Filtrar tutorias por situação")
    rotulo: string;
}

// Filtro em botões lado a lado (ex.: Todas / Ativas / Finalizadas).
// Só muda a URL: quem chama a API com o filtro é a página, no servidor.
// Os outros parâmetros da URL são mantidos.
export function FiltroAbas({ parametro, opcoes, valor, rotulo }: Props){
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [carregando, startTransition] = useTransition();

    function handleClick(novoValor: string){
        const params = new URLSearchParams(searchParams.toString());

        if(novoValor) params.set(parametro, novoValor);
        else params.delete(parametro);

        const query = params.toString();
        startTransition(() => {
            router.push(query ? `${pathname}?${query}` : pathname);
        });
    }

    return (
        <div className={styles.filtro} role="group" aria-label={rotulo} aria-busy={carregando}>
            {opcoes.map((opcao) => {
                const ativo = opcao.valor === valor;

                return (
                    <button
                    key={opcao.valor}
                    type="button"
                    className={ativo ? styles.ativo : styles.opcao}
                    aria-pressed={ativo}
                    disabled={carregando}
                    onClick={() => handleClick(opcao.valor)}
                    >
                        {opcao.rotulo}
                    </button>
                )
            })}
        </div>
    )
}
