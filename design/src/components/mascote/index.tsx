import Image from 'next/image'
import { ImagemMascote, TAMANHO_MASCOTE_PX } from '@/lib/mascotes'

interface Props {
    imagem: ImagemMascote;
    // Classe de quem usa: é ela que define a altura do mascote na tela
    className?: string;
    // true só no login e no início: a imagem aparece logo ao abrir a página
    preload?: boolean;
}

// Imagem do mascote (lib/mascotes.ts) com o tamanho real do arquivo.
// O tamanho na tela vem do CSS (className) de cada componente
export function Mascote({ imagem, className, preload = false }: Props){
    return (
        <Image
        src={imagem.src}
        alt={imagem.alt}
        width={TAMANHO_MASCOTE_PX}
        height={TAMANHO_MASCOTE_PX}
        className={className}
        preload={preload}
        />
    )
}
