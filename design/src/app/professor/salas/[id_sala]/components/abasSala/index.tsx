"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ABAS_SALA } from '../../abas'

interface Props {
    idSala: number;
}

// Barra de abas da sala. É "use client" só para ler a URL atual (usePathname)
// e destacar a aba ativa. Nenhuma chamada à API sai daqui.
export function AbasSala({ idSala }: Props){
    const pathname = usePathname();
    const base = `/professor/salas/${idSala}`;

    // Só aparecem as abas que já têm página
    const abas = ABAS_SALA.filter((aba) => aba.disponivel);

    function hrefDa(caminho: string){
        return caminho ? `${base}/${caminho}` : base;
    }

    // "Resumo" (caminho vazio) só fica ativa na raiz da sala;
    // as outras ficam ativas na própria URL e nas sub-rotas dela
    function estaAtiva(caminho: string){
        if(!caminho) return pathname === base;

        const href = hrefDa(caminho);
        return pathname === href || pathname.startsWith(href + "/");
    }

    return (
        <nav className={styles.abas} aria-label="Seções da sala">
            {abas.map((aba) => {
                const ativa = estaAtiva(aba.caminho);

                return (
                    <Link
                    key={aba.rotulo}
                    href={hrefDa(aba.caminho)}
                    className={ativa ? styles.abaAtiva : styles.aba}
                    aria-current={ativa ? "page" : undefined}
                    >
                        {aba.rotulo}
                    </Link>
                )
            })}
        </nav>
    )
}
