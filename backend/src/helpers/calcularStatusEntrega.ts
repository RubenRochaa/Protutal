// status de entrega de uma atividade para um aluno.
// é calculado (não fica salvo no banco): compara a data de envio da resposta com o prazo
type StatusEntrega = "pendente" | "entregue" | "entregue_com_atraso";

// valores aceitos, usados também para validar filtros (?status=)
const STATUS_ENTREGA: StatusEntrega[] = ["pendente", "entregue", "entregue_com_atraso"];

// data_envio é null quando o aluno ainda não respondeu
function calcularStatusEntrega(data_entrega: Date, data_envio: Date | null): StatusEntrega {
    if (!data_envio) {
        return "pendente";
    }

    return data_envio.getTime() <= data_entrega.getTime()
        ? "entregue"
        : "entregue_com_atraso";
}

export { calcularStatusEntrega, STATUS_ENTREGA };
export type { StatusEntrega };
