export type TurmaId = '401' | '402' | '501' | '502';

export interface Student {
  id: string;
  nome: string; // Normalizado: MAIÚSCULO, sem acentos, Ç -> C
  turma: TurmaId;
  numeroConta: string; // Único na escola
  saldo: number;
}

export type OperationType = 'DEPOSITO' | 'SAQUE' | 'RESGATE_INVESTIMENTO';
export type OperationStatus = 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA';

export interface Operation {
  id: string;
  protocolo: string;
  alunoId: string;
  alunoNome: string;
  turma: TurmaId;
  numeroConta: string;
  tipo: OperationType;
  valor: number;
  dataHora: string;
  status: OperationStatus;
  detalhes?: {
    investimentoId?: string;
    opcaoTitulo?: string;
    rendimento?: number;
    penalidade?: number;
    valorLiquido?: number;
  };
}

export type InvestmentOptionId = 'OPCAO_1' | 'OPCAO_2' | 'OPCAO_3';

export interface InvestmentOptionConfig {
  id: InvestmentOptionId;
  nome: string;
  descricaoCurta: string;
  detalhesRegra: string;
  rendimentoTaxaPercentual: number; // Ex: 5% (valores de teste temporários)
  prazoMinimoDias: number; // Ex: 0 para opção 1, 30 para opção 2, 60 para opção 3
  permiteResgateAntecipado: boolean;
  penalidadeAntecipadaPercentual: number; // Ex: 20% sobre o rendimento ou principal conforme regra
  corDestaque: string;
  icone: string;
}

export interface InvestmentRecord {
  id: string;
  alunoId: string;
  opcaoId: InvestmentOptionId;
  opcaoNome: string;
  valorAplicado: number;
  dataAplicacao: string;
  dataVencimento: string;
  status: 'ATIVO' | 'RESGATE_PENDENTE' | 'RESGATADO';
  rendimentoAcumulado: number;
  valorResgateCalculado: number;
  penalidadeAplicada: number;
  protocoloResgate?: string;
}

export interface ImportSummary {
  turmaIdentificada: TurmaId | null;
  nomeArquivo: string;
  totalLinhasLidas: number;
  registrosValidos: Student[];
  erros: string[];
}
