"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GRUPOS_ABAS_SALA } from '../../abas'

interface Props {
    idSala: number;
}

// Abas da sala em duas linhas: as 5 abas principais e, embaixo, as sub-abas do grupo aberto.
// É "use client" só para ler a URL atual (usePathname) e destacar a aba ativa.
// Nenhuma chamada à API sai daqui.
export function AbasSala({ idSala }: Props){
    const pathname = usePathname();
    const base = `/professor/salas/${idSala}`;

    function hrefDa(caminho: string){
        return caminho ? `${base}/${caminho}` : base;
    }

    // "Visão geral" (caminho vazio) só fica ativa na raiz da sala;
    // as outras ficam ativas na própria URL e nas sub-rotas dela (ex.: /atividades/12)
    function estaAtiva(caminho: string){
        if(!caminho) return pathname === base;

        const href = hrefDa(caminho);
        return pathname === href || pathname.startsWith(href + "/");
    }

    // A aba principal ativa é a que tem alguma sub-aba ativa
    const grupoAtivo = GRUPOS_ABAS_SALA.find((grupo) => grupo.subabas.some((sub) => estaAtiva(sub.caminho)));

    return (
        <div className={styles.navegacao}>
            <nav className={styles.abas} aria-label="Seções da sala">
                {GRUPOS_ABAS_SALA.map((grupo) => {
                    const ativa = grupo === grupoAtivo;

                    return (
                        <Link
                        key={grupo.rotulo}
                        href={hrefDa(grupo.subabas[0].caminho)}
                        className={ativa ? styles.abaAtiva : styles.aba}
                        aria-current={ativa ? "page" : undefined}
                        >
                            {grupo.rotulo}
                        </Link>
                    )
                })}
            </nav>

            {grupoAtivo && grupoAtivo.subabas.length > 1 && (
                <nav className={styles.subabas} aria-label={`Subseções de ${grupoAtivo.rotulo}`}>
                    {grupoAtivo.subabas.map((sub) => {
                        const ativa = estaAtiva(sub.caminho);

                        return (
                            <Link
                            key={sub.caminho}
                            href={hrefDa(sub.caminho)}
                            className={ativa ? styles.subabaAtiva : styles.subaba}
                            aria-current={ativa ? "page" : undefined}
                            >
                                {sub.rotulo}
                            </Link>
                        )
                    })}
                </nav>
            )}
        </div>
    )
}
