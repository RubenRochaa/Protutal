import styles from './styles.module.scss'
import { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface Opcao {
    valor: string;
    rotulo: string;
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    name: string;
    opcoes: Opcao[];
    placeholder?: string;
}

// Caixa de escolha com o rótulo em cima, no mesmo estilo do Input.
// "valor" é o que vai para a API; "rotulo" é o que o usuário vê (ex.: aula_invertida / Aula invertida)
export function Select({ label, name, opcoes, placeholder, defaultValue, ...rest }: Props){
    // Com placeholder e sem valor escolhido, começa na opção vazia.
    // Se vier "value" (select controlado), o defaultValue não pode ser usado junto.
    const valorInicial = rest.value !== undefined
        ? undefined
        : defaultValue ?? (placeholder ? "" : undefined);

    return (
        <div className={styles.campo}>
            <label htmlFor={name} className={styles.label}>{label}</label>

            <div className={styles.caixa}>
                <select
                id={name}
                name={name}
                className={styles.select}
                defaultValue={valorInicial}
                {...rest}
                >
                    {placeholder && <option value="" disabled>{placeholder}</option>}

                    {opcoes.map((opcao) => (
                        <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
                    ))}
                </select>

                <ChevronDown className={styles.seta} size={18} aria-hidden="true" />
            </div>
        </div>
    )
}
