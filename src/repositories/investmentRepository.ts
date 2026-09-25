import {
  InvestmentOptionId,
  InvestmentRecord,
} from '../domain/types';

import { supabase } from '../lib/supabase';

interface InvestmentRow {
  id: string;
  aluno_id: string;

  opcao_id: string;
  opcao_nome: string;

  valor_aplicado: number | string;

  data_aplicacao: string;
  data_vencimento: string;

  status: string;

  rendimento_acumulado:
    | number
    | string;

  valor_resgate_calculado:
    | number
    | string
    | null;

  penalidade_aplicada:
    | number
    | string;

  protocolo_resgate:
    | string
    | null;

  protocolo_aplicacao?:
    | string
    | null;
}

class InvestmentRepository {
  private mapInvestment(
    row: InvestmentRow
  ): InvestmentRecord {
    return {
      id: row.id,

      alunoId:
        row.aluno_id,

      opcaoId:
        row.opcao_id as InvestmentOptionId,

      opcaoNome:
        row.opcao_nome,

      valorAplicado:
        Number(row.valor_aplicado),

      dataAplicacao:
        row.data_aplicacao,

      dataVencimento:
        row.data_vencimento,

      status:
        row.status as InvestmentRecord['status'],

      rendimentoAcumulado:
        Number(
          row.rendimento_acumulado
        ),

      valorResgateCalculado:
        row.valor_resgate_calculado ===
        null
          ? Number(
              row.valor_aplicado
            )
          : Number(
              row.valor_resgate_calculado
            ),

      penalidadeAplicada:
        Number(
          row.penalidade_aplicada
        ),

      protocoloResgate:
        row.protocolo_resgate ??
        undefined,
    };
  }

  private extractSingleRow(
    data: unknown
  ): InvestmentRow | null {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return (
        (data[0] as InvestmentRow) ??
        null
      );
    }

    return data as InvestmentRow;
  }

  async getAll(): Promise<
    InvestmentRecord[]
  > {
    const { data, error } =
      await supabase
        .from('investments')
        .select(
          `
          id,
          aluno_id,
          opcao_id,
          opcao_nome,
          valor_aplicado,
          data_aplicacao,
          data_vencimento,
          status,
          rendimento_acumulado,
          valor_resgate_calculado,
          penalidade_aplicada,
          protocolo_resgate,
          protocolo_aplicacao
        `
        )
        .order(
          'data_aplicacao',
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        'Erro ao carregar investimentos:',
        error
      );

      throw new Error(
        'Não foi possível carregar os investimentos.'
      );
    }

    return (data ?? []).map(
      (row) =>
        this.mapInvestment(
          row as InvestmentRow
        )
    );
  }

  async getByStudent(
    alunoId: string
  ): Promise<
    InvestmentRecord[]
  > {
    const { data, error } =
      await supabase
        .from('investments')
        .select(
          `
          id,
          aluno_id,
          opcao_id,
          opcao_nome,
          valor_aplicado,
          data_aplicacao,
          data_vencimento,
          status,
          rendimento_acumulado,
          valor_resgate_calculado,
          penalidade_aplicada,
          protocolo_resgate,
          protocolo_aplicacao
        `
        )
        .eq(
          'aluno_id',
          alunoId
        )
        .order(
          'data_aplicacao',
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        'Erro ao carregar investimentos do aluno:',
        error
      );

      throw new Error(
        'Não foi possível carregar os investimentos do aluno.'
      );
    }

    return (data ?? []).map(
      (row) =>
        this.mapInvestment(
          row as InvestmentRow
        )
    );
  }

  async getActiveByStudent(
    alunoId: string
  ): Promise<
    InvestmentRecord[]
  > {
    const { data, error } =
      await supabase
        .from('investments')
        .select(
          `
          id,
          aluno_id,
          opcao_id,
          opcao_nome,
          valor_aplicado,
          data_aplicacao,
          data_vencimento,
          status,
          rendimento_acumulado,
          valor_resgate_calculado,
          penalidade_aplicada,
          protocolo_resgate,
          protocolo_aplicacao
        `
        )
        .eq(
          'aluno_id',
          alunoId
        )
        .eq(
          'status',
          'ATIVO'
        )
        .order(
          'data_aplicacao',
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        'Erro ao carregar investimentos ativos:',
        error
      );

      throw new Error(
        'Não foi possível carregar os investimentos ativos.'
      );
    }

    return (data ?? []).map(
      (row) =>
        this.mapInvestment(
          row as InvestmentRow
        )
    );
  }

  async getById(
    id: string
  ): Promise<
    InvestmentRecord | null
  > {
    const { data, error } =
      await supabase
        .from('investments')
        .select(
          `
          id,
          aluno_id,
          opcao_id,
          opcao_nome,
          valor_aplicado,
          data_aplicacao,
          data_vencimento,
          status,
          rendimento_acumulado,
          valor_resgate_calculado,
          penalidade_aplicada,
          protocolo_resgate,
          protocolo_aplicacao
        `
        )
        .eq(
          'id',
          id
        )
        .maybeSingle();

    if (error) {
      console.error(
        'Erro ao buscar investimento:',
        error
      );

      throw new Error(
        'Não foi possível buscar o investimento.'
      );
    }

    if (!data) {
      return null;
    }

    return this.mapInvestment(
      data as InvestmentRow
    );
  }

  /**
   * Aplicação imediata.
   *
   * O Supabase:
   * - valida saldo;
   * - debita o saldo;
   * - cria o investimento;
   * - registra o histórico.
   */
  async applyInvestment(
    alunoId: string,
    opcaoId: InvestmentOptionId,
    valor: number,
    protocolo: string
  ): Promise<InvestmentRecord> {
    if (valor <= 0) {
      throw new Error(
        'O valor da aplicação deve ser maior que zero.'
      );
    }

    const { data, error } =
      await supabase.rpc(
        'apply_investment',
        {
          p_student_id:
            alunoId,

          p_option_id:
            opcaoId,

          p_amount:
            valor,

          p_protocol:
            protocolo,
        }
      );

    if (error) {
      console.error(
        'Erro ao aplicar investimento:',
        error
      );

      if (
        error.message
          .toLowerCase()
          .includes(
            'saldo insuficiente'
          )
      ) {
        throw new Error(
          'Saldo insuficiente para esta aplicação.'
        );
      }

      throw new Error(
        error.message ||
          'Não foi possível realizar a aplicação.'
      );
    }

    const row =
      this.extractSingleRow(
        data
      );

    if (!row?.id) {
      throw new Error(
        'Investimento criado, mas não foi possível identificá-lo.'
      );
    }

    const investment =
      await this.getById(
        row.id
      );

    if (!investment) {
      throw new Error(
        'Investimento criado, mas não foi possível recarregá-lo.'
      );
    }

    return investment;
  }

  /**
   * O resgate agora é marcado
   * diretamente pela função
   * request_investment_redemption.
   *
   * Mantemos este método porque
   * InvestmentModal ainda o chama.
   */
  async markRedemptionPending(
    investmentId: string,
    _protocolo: string,
    _valorResgate: number,
    _penalidade: number
  ): Promise<InvestmentRecord> {
    const investment =
      await this.getById(
        investmentId
      );

    if (!investment) {
      throw new Error(
        'Investimento não encontrado.'
      );
    }

    if (
      investment.status !==
      'RESGATE_PENDENTE'
    ) {
      throw new Error(
        'O resgate não foi registrado corretamente.'
      );
    }

    return investment;
  }

  /**
   * A efetivação do resgate
   * agora acontece dentro da
   * RPC confirm_operation.
   *
   * Este método não altera mais
   * o banco diretamente.
   */
  async finalizeRedemption(
    investmentId: string
  ): Promise<InvestmentRecord> {
    const investment =
      await this.getById(
        investmentId
      );

    if (!investment) {
      throw new Error(
        'Investimento não encontrado.'
      );
    }

    if (
      investment.status !==
      'RESGATADO'
    ) {
      throw new Error(
        'O investimento ainda não foi resgatado.'
      );
    }

    return investment;
  }
}

export const investmentRepository =
  new InvestmentRepository();