import { InvestmentOptionConfig, InvestmentOptionId, InvestmentRecord } from '../domain/types';

/**
 * =========================================================================
 * CONFIGURAÇÃO CENTRALIZADA DOS INVESTIMENTOS (PARÂMETROS TEMPORÁRIOS DE TESTE)
 * =========================================================================
 * ATENÇÃO: Os valores, prazos e taxas abaixo são parâmetros temporários
 * apenas para permitir o teste pedagógico e validação do fluxo do sistema.
 * Podem ser ajustados livremente sem necessidade de alterar as telas.
 */
export const INVESTMENT_CONFIGS: Record<InvestmentOptionId, InvestmentOptionConfig> = {
  OPCAO_1: {
    id: 'OPCAO_1',
    nome: 'Opção 1 - Cofrinho Livre',
    descricaoCurta: 'Menor rendimento, resgate a qualquer momento sem penalidade.',
    detalhesRegra: 'Ideal para quem pode precisar do Queimacash logo. Você pode resgatar a qualquer momento e receber o rendimento proporcional sem nenhum desconto.',
    rendimentoTaxaPercentual: 5, // 5% de rendimento (parâmetro de teste)
    prazoMinimoDias: 1, // Resgate livre imediato
    permiteResgateAntecipado: true,
    penalidadeAntecipadaPercentual: 0, // Sem penalidade
    corDestaque: 'emerald',
    icone: 'Sprout',
  },
  OPCAO_2: {
    id: 'OPCAO_2',
    nome: 'Opção 2 - Prazo Determinado',
    descricaoCurta: 'Rendimento maior com prazo fixo. O valor fica guardado até o vencimento.',
    detalhesRegra: 'Para quem planeja guardar por um tempo determinado. O resgate fica bloqueado até o vencimento para garantir o rendimento maior.',
    rendimentoTaxaPercentual: 10, // 12% de rendimento (parâmetro de teste)
    prazoMinimoDias: 7, // 30 dias de prazo fixo (para teste)
    permiteResgateAntecipado: false, // Não permite antes do vencimento
    penalidadeAntecipadaPercentual: 0,
    corDestaque: 'amber',
    icone: 'Clock',
  },
  OPCAO_3: {
    id: 'OPCAO_3',
    nome: 'Opção 3 - Longo Prazo com Flexibilidade',
    descricaoCurta: 'Maior rendimento com prazo longo. Permite resgate antes com taxa de penalidade.',
    detalhesRegra: 'Para quem busca o maior crescimento possível. Se precisar retirar antes do prazo final, o sistema calcula uma penalidade sobre o rendimento.',
    rendimentoTaxaPercentual: 20, // 20% de rendimento no vencimento (parâmetro de teste)
    prazoMinimoDias: 30, // 60 dias de prazo total
    permiteResgateAntecipado: true, // Permite antecipado
    penalidadeAntecipadaPercentual: 50, // Penalidade de 50% sobre o rendimento acumulado se resgatar antes
    corDestaque: 'purple',
    icone: 'TrendingUp',
  },
};

/**
 * Retorna a lista das 3 opções de investimento
 */
export function getAvailableInvestmentOptions(): InvestmentOptionConfig[] {
  return [
    INVESTMENT_CONFIGS.OPCAO_1,
    INVESTMENT_CONFIGS.OPCAO_2,
    INVESTMENT_CONFIGS.OPCAO_3,
  ];
}

/**
 * Calcula o valor de resgate e eventuais rendimentos/penalidades
 * baseado na data atual e nas regras do produto
 */
export function calculateRedemption(investment: InvestmentRecord): {
  podeResgatar: boolean;
  motivoBloqueio?: string;
  isAntecipado: boolean;
  rendimentoBruto: number;
  penalidade: number;
  rendimentoLiquido: number;
  valorTotalReceber: number;
} {
  const config = INVESTMENT_CONFIGS[investment.opcaoId];

  const now = new Date();
  const dataAplicacao = new Date(investment.dataAplicacao);
  const dataVencimento = new Date(investment.dataVencimento);

  const isVencido = now >= dataVencimento;
  const isAntecipado = !isVencido;

  // Modalidades bloqueadas não podem ser resgatadas antes do vencimento
  if (isAntecipado && !config.permiteResgateAntecipado) {
    return {
      podeResgatar: false,
      motivoBloqueio: `Esta modalidade tem prazo fixo. O valor estará disponível para resgate a partir de ${dataVencimento.toLocaleDateString('pt-BR')}.`,
      isAntecipado: true,
      rendimentoBruto: 0,
      penalidade: 0,
      rendimentoLiquido: 0,
      valorTotalReceber: investment.valorAplicado,
    };
  }

  const MS_POR_DIA = 24 * 60 * 60 * 1000;

  const totalDias = Math.max(
    1,
    Math.round(
      (dataVencimento.getTime() - dataAplicacao.getTime()) / MS_POR_DIA
    )
  );

  const diasDecorridos = Math.max(
    0,
    Math.floor(
      (now.getTime() - dataAplicacao.getTime()) / MS_POR_DIA
    )
  );

  // Nunca rende além do prazo contratado
  const diasConsiderados = Math.min(diasDecorridos, totalDias);

  const proporcaoTempo = diasConsiderados / totalDias;

  // Rendimento máximo somente no vencimento
  const rendimentoNoVencimento =
    (investment.valorAplicado * config.rendimentoTaxaPercentual) / 100;

  // Quanto realmente foi ganho até hoje
  const rendimentoBruto = Number(
    (rendimentoNoVencimento * proporcaoTempo).toFixed(2)
  );

  let penalidade = 0;

  // Penalidade somente sobre o rendimento já acumulado
  if (
    isAntecipado &&
    config.penalidadeAntecipadaPercentual > 0
  ) {
    penalidade = Number(
      (
        rendimentoBruto *
        (config.penalidadeAntecipadaPercentual / 100)
      ).toFixed(2)
    );
  }

  const rendimentoLiquido = Number(
    Math.max(0, rendimentoBruto - penalidade).toFixed(2)
  );

  const valorTotalReceber = Number(
    (investment.valorAplicado + rendimentoLiquido).toFixed(2)
  );

  return {
    podeResgatar: true,
    isAntecipado,
    rendimentoBruto,
    penalidade,
    rendimentoLiquido,
    valorTotalReceber,
  };
}
