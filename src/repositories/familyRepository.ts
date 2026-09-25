import { supabase } from '../lib/supabase';
import { normalizeAccountNumber } from '../utils/normalization';

export interface FamilyStudent {
  nome: string;
  turma: string;
  numeroConta: string;
  saldo: number;
}

export interface FamilyInvestment {
  id: string;
  opcaoNome: string;
  valorAplicado: number;
  valorAtual: number;
  dataAplicacao: string;
  dataVencimento: string;
  status: string;
  rendimentoAcumulado: number;
}

export interface FamilyHistoryItem {
  id: string;
  dataHora: string;
  tipo: string;
  descricao: string;
  valor: number;
  saldoDisponivel: number;
  valorInvestido: number;
  total: number;
}

export interface FamilyAccount {
  student: FamilyStudent;
  investments: FamilyInvestment[];
  history: FamilyHistoryItem[];
}

class FamilyRepository {
  async getByAccountNumber(
    accountNumber: string
  ): Promise<FamilyAccount | null> {
    const normalizedAccount =
      normalizeAccountNumber(accountNumber);

    if (!normalizedAccount) {
      return null;
    }

    const { data, error } = await supabase.rpc(
      'get_family_account',
      {
        p_account_number: normalizedAccount,
      }
    );

    if (error) {
      console.error(
        'Erro ao consultar Portal da Família:',
        error
      );

      throw new Error(
        'Não foi possível consultar a conta.'
      );
    }

    if (!data) {
      return null;
    }

    return data as FamilyAccount;
  }
}

export const familyRepository =
  new FamilyRepository();