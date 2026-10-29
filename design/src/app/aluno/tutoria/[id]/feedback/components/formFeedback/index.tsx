"use client"

import styles from './styles.module.scss'
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card } from '@/components/card'
import { Select } from '@/components/select'
import { Input } from '@/components/input'
import { FileUpload } from '@/components/fileUpload'
import { Button } from '@/components/button'
import { handleEnviarFeedback } from '../../../../actions'

interface Props {
    idTutoria: number;
    tutor: string;
}

const ETAPAS = [
    { valor: "1", rotulo: "1ª etapa" },
    { valor: "2", rotulo: "2ª etapa" },
    { valor: "3", rotulo: "3ª etapa" },
]

// Mesmas regras da A10 (aqui aceitando vírgula, que a action troca por ponto)
const NOTA_VALIDA = /^\d+([.,]\d{1,2})?$/

type Erros = Partial<Record<"etapa" | "nota" | "file", string>>

// Confere os campos antes de chamar a API. Formato e tamanho do arquivo o FileUpload já confere
function validar(dados: FormData): Erros {
    const erros: Erros = {}
    const nota = String(dados.get("nota") ?? "").trim()
    const arquivo = dados.get("file")

    if(!ETAPAS.some((etapa) => etapa.valor === dados.get("etapa"))) erros.etapa = "Escolha a etapa."

    if(nota === "") erros.nota = "Informe a nota."
    else if(!NOTA_VALIDA.test(nota) || Number(nota.replace(",", ".")) > 10){
        erros.nota = "A nota deve ser de 0 a 10, com no máximo 2 casas decimais (ex.: 8,5)."
    }

    if(!(arquivo instanceof File) || arquivo.size === 0) erros.file = "Escolha o arquivo da rubrica."

    return erros
}

// Formulário "Avaliar meu tutor" (rota A10): etapa, nota, comentário e rubrica.
// Segue o modelo do FormResposta: valida no navegador, envia pela Server Action e mostra toast
export function FormFeedback({ idTutoria, tutor }: Props){
    const router = useRouter();
    const [estado, formAction] = useActionState(handleEnviarFeedback, {});
    const [erros, setErros] = useState<Erros>({});

    useEffect(() => {
        if(estado.error) toast.error(estado.error);

        if(estado.sucesso){
            toast.success(estado.sucesso);
            if(estado.redirecionar) router.push(estado.redirecionar);
        }
    }, [estado, router]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const encontrados = validar(new FormData(e.currentTarget));
        setErros(encontrados);

        if(Object.keys(encontrados).length > 0) e.preventDefault();
    }

    return (
        <Card titulo={`Avaliar o tutor ${tutor}`} sublinhado className={styles.card}>
            <p className={styles.explicacao}>
                A rubrica é o documento que formaliza a sua avaliação: nele você registra, item por item,
                como foi o trabalho do tutor. O professor usa a rubrica para avaliar o tutor.
                Você pode enviar uma avaliação por etapa.
            </p>

            <form
            action={formAction}
            onSubmit={handleSubmit}
            onChange={() => setErros({})}
            className={styles.form}
            noValidate
            >
                <input type="hidden" name="id_tutoria" value={idTutoria} />

                <div className={styles.linha}>
                    <div className={styles.campo}>
                        <Select
                        label="Etapa"
                        name="etapa"
                        opcoes={ETAPAS}
                        placeholder="Escolha a etapa"
                        defaultValue={estado.valores?.etapa}
                        // key: depois de um erro, o select volta com a etapa escolhida
                        key={`etapa-${estado.valores?.etapa ?? ""}`}
                        aria-invalid={erros.etapa ? true : undefined}
                        required
                        />
                        {erros.etapa && <p className={styles.erro} role="alert">{erros.etapa}</p>}
                    </div>

                    <div className={styles.campo}>
                        <Input
                        label="Nota (0 a 10)"
                        name="nota"
                        inputMode="decimal"
                        placeholder="Ex.: 8,5"
                        defaultValue={estado.valores?.nota}
                        aria-invalid={erros.nota ? true : undefined}
                        required
                        />
                        {erros.nota && <p className={styles.erro} role="alert">{erros.nota}</p>}
                    </div>
                </div>

                <div className={styles.campo}>
                    <label htmlFor="comentario" className={styles.label}>Comentário (opcional)</label>
                    <textarea
                    id="comentario"
                    name="comentario"
                    rows={4}
                    placeholder="Conte como o tutor ajudou você"
                    defaultValue={estado.valores?.comentario}
                    className={styles.textarea}
                    />
                </div>

                <div className={styles.campo}>
                    <p className={styles.label}>Rubrica</p>
                    <FileUpload required />
                    {erros.file && <p className={styles.erro} role="alert">{erros.file}</p>}
                </div>

                <Button name="Enviar avaliação" nameCarregando="Enviando..." />
            </form>
        </Card>
    )
}
