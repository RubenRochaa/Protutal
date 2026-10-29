"use client"

import styles from './styles.module.scss'
import { useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { FileText, Upload } from 'lucide-react'

interface Props {
    name?: string;
    required?: boolean;
}

// Mesmas regras do back-end para resposta e material de apoio
const EXTENSOES = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"];
const TAMANHO_MAXIMO = 10 * 1024 * 1024; // 10 MB

function validarArquivo(arquivo: File): string | null {
    const nome = arquivo.name.toLowerCase();

    if(!EXTENSOES.some((extensao) => nome.endsWith(extensao))){
        return "Formato não aceito. Envie um arquivo .pdf, .doc, .docx, .xls, .xlsx ou .csv.";
    }

    if(arquivo.size > TAMANHO_MAXIMO){
        return "O arquivo deve ter no máximo 10 MB.";
    }

    return null
}

// Área de upload de UM arquivo: clicar abre o seletor, ou arrastar e soltar.
// O arquivo fica dentro de um <input type="file"> de verdade, então vai no FormData
// do <form> (Server Action) com o nome "file".
export function FileUpload({ name = "file", required }: Props){
    const inputRef = useRef<HTMLInputElement>(null);
    const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
    const [arrastando, setArrastando] = useState(false);
    const { pending } = useFormStatus();

    // O React limpa o form depois que a Server Action termina: limpamos o nome junto
    useEffect(() => {
        const form = inputRef.current?.form;
        if(!form) return;

        const limpar = () => setNomeArquivo(null);
        form.addEventListener("reset", limpar);

        return () => form.removeEventListener("reset", limpar);
    }, []);

    // Arquivo escolhido pelo seletor (clique)
    function handleChange(e: React.ChangeEvent<HTMLInputElement>){
        const arquivo = e.target.files?.[0];

        if(!arquivo){
            setNomeArquivo(null);
            return;
        }

        const erro = validarArquivo(arquivo);
        if(erro){
            toast.error(erro);
            e.target.value = "";
            setNomeArquivo(null);
            return;
        }

        setNomeArquivo(arquivo.name);
    }

    // Arquivo solto na área: colocamos dentro do input para ele ir no FormData
    function handleDrop(e: React.DragEvent<HTMLLabelElement>){
        e.preventDefault();
        setArrastando(false);

        if(pending || !inputRef.current) return;

        const arquivos = e.dataTransfer.files;
        if(arquivos.length === 0) return;

        if(arquivos.length > 1){
            toast.error("Envie apenas um arquivo.");
            return;
        }

        const erro = validarArquivo(arquivos[0]);
        if(erro){
            toast.error(erro);
            return;
        }

        const transferencia = new DataTransfer();
        transferencia.items.add(arquivos[0]);
        inputRef.current.files = transferencia.files;

        setNomeArquivo(arquivos[0].name);
    }

    function handleDragOver(e: React.DragEvent<HTMLLabelElement>){
        e.preventDefault();
        if(!pending) setArrastando(true);
    }

    const classes = [
        styles.quadro,
        arrastando ? styles.arrastando : "",
        pending ? styles.desabilitado : "",
    ].join(" ");

    return (
        <label
        className={classes}
        onDragOver={handleDragOver}
        onDragLeave={() => setArrastando(false)}
        onDrop={handleDrop}
        >
            <input
            ref={inputRef}
            type="file"
            name={name}
            accept={EXTENSOES.join(",")}
            required={required}
            disabled={pending}
            onChange={handleChange}
            className={styles.input}
            />

            <Upload className={styles.icone} aria-hidden="true" />

            <span className={styles.texto}>
                Arraste o arquivo ou clique para carregar o arquivo
            </span>

            <span className={styles.dica}>PDF, DOC, DOCX, XLS, XLSX ou CSV, até 10 MB</span>

            {nomeArquivo && (
                <span className={styles.arquivo}>
                    <FileText size={18} aria-hidden="true" />
                    {nomeArquivo}
                </span>
            )}
        </label>
    )
}
