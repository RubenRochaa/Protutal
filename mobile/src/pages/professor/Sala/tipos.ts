import { ReactElement } from "react";

import { SalaDetalhe, StatusContestacao, TutorSala } from "../../../lib/types";
import { ProfessorScreenProps } from "../../../routes/professor.routes";
import { SubAbaSala } from "./abas";

// Props que a tela da sala passa para cada sub-aba
export interface PropsAba {
    sala: SalaDetalhe;
    // Tutores ativos (P24), já buscados pela moldura para o interruptor de permissão
    tutores: TutorSala[];
    // Topo da sala (série, permissão e abas): vai no começo da lista da sub-aba e rola junto
    cabecalho: ReactElement;
    // Busca a sala e os tutores de novo (ex.: depois de aceitar um pedido ou remover um tutor)
    atualizarSala: () => void;
    // Abre outra sub-aba (ex.: indicador da Visão geral -> lista completa)
    irPara: (subaba: SubAbaSala) => void;
    // Filtro inicial de status da aba Contestações (vindo das Notificações)
    status?: StatusContestacao;
    navigation: ProfessorScreenProps<"Sala">["navigation"];
}
