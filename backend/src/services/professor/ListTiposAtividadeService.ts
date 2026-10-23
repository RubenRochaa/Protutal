import { TipoAtividade } from "../../generated/prisma";
import { ROTULOS_TIPO_ATIVIDADE } from "../../helpers/rotulosTipoAtividade";

class ListTiposAtividadeService {
    async execute() {

        // não consulta o banco: os valores vêm do enum gerado pelo Prisma,
        // então acompanham o schema. Object.values mantém a ordem em que o enum foi declarado
        const tipos = Object.values(TipoAtividade).map((valor) => ({
            valor: valor,
            rotulo: ROTULOS_TIPO_ATIVIDADE[valor]
        }));

        return tipos;
    }
}

export { ListTiposAtividadeService };
