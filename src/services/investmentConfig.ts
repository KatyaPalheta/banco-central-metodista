import {
  InvestmentOptionConfig,
  InvestmentOptionId,
  InvestmentRecord,
} from '../domain/types';

/**
 * Taxas para novas aplicações:
 * Opção 1: 1% em 1 dia.
 * Opção 2: 8% em 7 dias, com devolução automática.
 * Opção 3: 36% por ciclo de 30 dias, com renovação automática.
 */
export const INVESTMENT_CONFIGS: Record<
  InvestmentOptionId,
  InvestmentOptionConfig
> = {
  OPCAO_1: {
    id: 'OPCAO_1',
    nome: 'Opção 1 - Cofrinho Livre',
    descricaoCurta:
      'Menor rendimento, resgate a qualquer momento sem penalidade.',
    detalhesRegra:
      'Ideal para quem pode precisar do Queimacash logo. Você pode resgatar a qualquer momento e receber o rendimento acumulado sem desconto. Após o prazo de 1 dia, o investimento deixa de render e permanece aplicado até você solicitar o resgate.',
    rendimentoTaxaPercentual: 1,
    prazoMinimoDias: 1,
    permiteResgateAntecipado: true,
    penalidadeAntecipadaPercentual: 0,
    corDestaque: 'emerald',
    icone: 'Sprout',
  },

  OPCAO_2: {
    id: 'OPCAO_2',
    nome: 'Opção 2 - Prazo Determinado',
    descricaoCurta:
      'Fica guardado por 7 dias. No vencimento, o valor e os juros voltam automaticamente para a conta.',
    detalhesRegra:
      'O resgate fica bloqueado durante os 7 dias. No processamento automático do vencimento, o valor investido e os juros são creditados no saldo da conta, e o investimento é encerrado. Não é necessária confirmação do professor para essa devolução.',
    rendimentoTaxaPercentual: 8,
    prazoMinimoDias: 7,
    permiteResgateAntecipado: false,
    penalidadeAntecipadaPercentual: 0,
    corDestaque: 'amber',
    icone: 'Clock',
  },

  OPCAO_3: {
    id: 'OPCAO_3',
    nome: 'Opção 3 - Longo Prazo com Flexibilidade',
    descricaoCurta:
      'A cada 30 dias, os juros se somam ao valor investido e começa um novo ciclo.',
    detalhesRegra:
      'Durante cada ciclo de 30 dias, os juros ficam acumulados separadamente. No processamento do vencimento, eles são incorporados ao valor investido e o acumulado de juros é zerado. O novo ciclo rende sobre esse valor maior. Se você resgatar antes do próximo vencimento, a penalidade é de 50% somente sobre os juros acumulados no ciclo atual. Os juros incorporados nos ciclos anteriores fazem parte do valor investido e não recebem essa penalidade.',
    rendimentoTaxaPercentual: 36,
    prazoMinimoDias: 30,
    permiteResgateAntecipado: true,
    penalidadeAntecipadaPercentual: 50,
    corDestaque: 'purple',
    icone: 'TrendingUp',
  },
};

export function getAvailableInvestmentOptions(): InvestmentOptionConfig[] {
  return [
    INVESTMENT_CONFIGS.OPCAO_1,
    INVESTMENT_CONFIGS.OPCAO_2,
    INVESTMENT_CONFIGS.OPCAO_3,
  ];
}

/**
 * Prévia calculada com o rendimento acumulado recebido do Supabase.
 * O valor definitivo do resgate é calculado pela função SQL.
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
  const dataVencimento = new Date(investment.dataVencimento);
  const isAntecipado = now < dataVencimento;

  const rendimentoBruto = investment.rendimentoAcumulado;

  const totalSemPenalidade = Number(
    (investment.valorAplicado + rendimentoBruto).toFixed(2)
  );

  if (investment.status !== 'ATIVO') {
    return {
      podeResgatar: false,
      motivoBloqueio:
        'Este investimento não está disponível para uma nova solicitação de resgate.',
      isAntecipado,
      rendimentoBruto,
      penalidade: investment.penalidadeAplicada,
      rendimentoLiquido: Number(
        (rendimentoBruto - investment.penalidadeAplicada).toFixed(2)
      ),
      valorTotalReceber: investment.valorResgateCalculado,
    };
  }

  // Na opção 2, a devolução é sempre automática no vencimento.
  if (investment.opcaoId === 'OPCAO_2') {
    return {
      podeResgatar: false,
      motivoBloqueio: isAntecipado
        ? `O valor investido e os juros voltarão automaticamente ao saldo no processamento do vencimento, em ${dataVencimento.toLocaleDateString('pt-BR')}. Não é necessária confirmação do professor.`
        : 'O prazo terminou. O investimento aguarda a devolução automática do valor e dos juros ao saldo da conta. Consulte novamente após o processamento.',
      isAntecipado,
      rendimentoBruto,
      penalidade: 0,
      rendimentoLiquido: rendimentoBruto,
      valorTotalReceber: totalSemPenalidade,
    };
  }

  // Não apresenta resgate com dados do ciclo anterior.
  if (investment.opcaoId === 'OPCAO_3' && !isAntecipado) {
    return {
      podeResgatar: false,
      motivoBloqueio:
        'Este ciclo terminou e aguarda a renovação automática. Os juros serão incorporados ao valor investido e um novo ciclo de 30 dias começará. Consulte novamente após o processamento.',
      isAntecipado: false,
      rendimentoBruto,
      penalidade: 0,
      rendimentoLiquido: rendimentoBruto,
      valorTotalReceber: totalSemPenalidade,
    };
  }

  if (isAntecipado && !config.permiteResgateAntecipado) {
    return {
      podeResgatar: false,
      motivoBloqueio:
        `Esta modalidade não permite resgate antes de ${dataVencimento.toLocaleDateString('pt-BR')}.`,
      isAntecipado: true,
      rendimentoBruto,
      penalidade: 0,
      rendimentoLiquido: rendimentoBruto,
      valorTotalReceber: totalSemPenalidade,
    };
  }

  let penalidade = 0;

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
    (rendimentoBruto - penalidade).toFixed(2)
  );

  const valorTotalReceber = Number(
    (
      investment.valorAplicado +
      rendimentoBruto -
      penalidade
    ).toFixed(2)
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