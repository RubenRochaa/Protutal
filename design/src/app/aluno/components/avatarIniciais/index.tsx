import styles from './styles.module.scss'

interface Props {
    nome: string;
    tamanho?: "medio" | "grande";
}

// Primeira letra do primeiro e do último nome (ex.: "Ruben Rocha Barbosa" -> "RB"), como no Header
function iniciais(nome: string){
    const partes = nome.trim().split(/\s+/).filter(Boolean)
    if(partes.length === 0) return ""

    const primeira = partes[0][0]
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ""

    return (primeira + ultima).toUpperCase()
}

// Círculo com as iniciais no lugar da foto do Figma: a API não tem foto de usuário.
// O nome aparece ao lado em texto, então o círculo fica escondido do leitor de tela
export function AvatarIniciais({ nome, tamanho = "medio" }: Props){
    return (
        <span className={`${styles.avatar} ${styles[tamanho]}`} aria-hidden="true">
            {iniciais(nome)}
        </span>
    )
}
