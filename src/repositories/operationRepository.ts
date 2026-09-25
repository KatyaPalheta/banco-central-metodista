import {
  Operation,
  OperationType,
  TurmaId,
} from '../domain/types';

import { supabase } from '../lib/supabase';

interface OperationRow {
  id: string;
  protocolo: string;
  aluno_id: string;
  investimento_id: string | null;
  tipo: string;
  valor: number | string;
  status: string;
  detalhes: Operation['detalhes'] | null;
  created_at: string;
}

interface StudentMiniRow {
  id: string;
  nome: string;
  turma: string;
  numero_conta: string;
}

class OperationRepository {
  /**
   * Converte registros do Supabase
   * para o formato já usado pelo React.
   */
  private async enrichOperations(
    rows: OperationRow[]
  ): Promise<Operation[]> {
    if (rows.length === 0) {
      return [];
    }

    const studentIds = Array.from(
      new Set(rows.map((row) => row.aluno_id))
    );

    const { data: students, error } =
      await supabase
        .from('students')
        .select(
          'id, nome, turma, numero_conta'
        )
        .in('id', studentIds);

    if (error) {
      console.error(
        'Erro ao carregar alunos das operações:',
        error
      );

      throw new Error(
        'Não foi possível carregar os dados das operações.'
      );
    }

    const studentMap = new Map<
      string,
      StudentMiniRow
    >();

    for (const student of students ?? []) {
      const row =
        student as StudentMiniRow;

      studentMap.set(row.id, row);
    }

    return rows.map((row) => {
      const student =
        studentMap.get(row.aluno_id);

      return {
        id: row.id,
        protocolo: row.protocolo,

        alunoId: row.aluno_id,

        alunoNome:
          student?.nome ??
          'ALUNO NÃO ENCONTRADO',

        turma:
          (student?.turma ??
            '') as TurmaId,

        numeroConta:
          student?.numero_conta ?? '',

        tipo:
          row.tipo as OperationType,

        valor:
          Number(row.valor),

        dataHora:
          row.created_at,

        status:
          row.status as Operation['status'],

        detalhes:
          row.detalhes ??
          undefined,
      };
    });
  }

  /**
   * Busca uma operação específica.
   */
  private async getById(
    operationId: string
  ): Promise<Operation | null> {
    const { data, error } =
      await supabase
        .from('operations')
        .select(
          `
          id,
          protocolo,
          aluno_id,
          investimento_id,
          tipo,
          valor,
          status,
          detalhes,
          created_at
        `
        )
        .eq('id', operationId)
        .maybeSingle();

    if (error) {
      console.error(
        'Erro ao buscar operação:',
        error
      );

      throw new Error(
        'Não foi possível buscar a operação.'
      );
    }

    if (!data) {
      return null;
    }

    const operations =
      await this.enrichOperations([
        data as OperationRow,
      ]);

    return operations[0] ?? null;
  }

  /**
   * Todas as operações.
   */
  async getAll(): Promise<Operation[]> {
    const { data, error } =
      await supabase
        .from('operations')
        .select(
          `
          id,
          protocolo,
          aluno_id,
          investimento_id,
          tipo,
          valor,
          status,
          detalhes,
          created_at
        `
        )
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      console.error(
        'Erro ao carregar operações:',
        error
      );

      throw new Error(
        'Não foi possível carregar as operações.'
      );
    }

    return this.enrichOperations(
      (data ?? []) as OperationRow[]
    );
  }

  /**
   * Operações pendentes.
   *
   * Como a turma pertence ao aluno,
   * carregamos as operações e filtramos
   * após relacionar os alunos.
   */
  async getPendingByTurma(
    turma?: TurmaId
  ): Promise<Operation[]> {
    const { data, error } =
      await supabase
        .from('operations')
        .select(
          `
          id,
          protocolo,
          aluno_id,
          investimento_id,
          tipo,
          valor,
          status,
          detalhes,
          created_at
        `
        )
        .eq('status', 'PENDENTE')
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      console.error(
        'Erro ao carregar operações pendentes:',
        error
      );

      throw new Error(
        'Não foi possível carregar as operações pendentes.'
      );
    }

    const operations =
      await this.enrichOperations(
        (data ?? []) as OperationRow[]
      );

    if (!turma) {
      return operations;
    }

    return operations.filter(
      (operation) =>
        operation.turma === turma
    );
  }

  /**
   * Operações pendentes de um aluno.
   */
  async getPendingByStudent(
    studentId: string
  ): Promise<Operation[]> {
    const { data, error } =
      await supabase
        .from('operations')
        .select(
          `
          id,
          protocolo,
          aluno_id,
          investimento_id,
          tipo,
          valor,
          status,
          detalhes,
          created_at
        `
        )
        .eq(
          'aluno_id',
          studentId
        )
        .eq(
          'status',
          'PENDENTE'
        )
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      console.error(
        'Erro ao carregar operações do aluno:',
        error
      );

      throw new Error(
        'Não foi possível carregar as operações do aluno.'
      );
    }

    return this.enrichOperations(
      (data ?? []) as OperationRow[]
    );
  }

  /**
   * Soma dos saques ainda pendentes.
   *
   * A função request_withdrawal no banco
   * também valida isso novamente.
   */
  async getPendingWithdrawalsTotal(
    studentId: string
  ): Promise<number> {
    const { data, error } =
      await supabase
        .from('operations')
        .select('valor')
        .eq(
          'aluno_id',
          studentId
        )
        .eq(
          'status',
          'PENDENTE'
        )
        .eq(
          'tipo',
          'SAQUE'
        );

    if (error) {
      console.error(
        'Erro ao calcular saques pendentes:',
        error
      );

      throw new Error(
        'Não foi possível verificar os saques pendentes.'
      );
    }

    return (data ?? []).reduce(
      (total, row) =>
        total +
        Number(row.valor),
      0
    );
  }

  /**
   * Cria uma operação financeira.
   *
   * Mantemos a mesma assinatura antiga
   * para não quebrar DepositModal,
   * WithdrawModal e InvestmentModal.
   */
  async createPendingOperation(
    params: {
      protocolo: string;
      alunoId: string;
      alunoNome: string;
      turma: TurmaId;
      numeroConta: string;
      tipo: OperationType;
      valor: number;
      detalhes?: Operation['detalhes'];
    }
  ): Promise<Operation> {
    let operationId:
      | string
      | undefined;

    if (
      params.tipo === 'DEPOSITO'
    ) {
      const { data, error } =
        await supabase.rpc(
          'request_deposit',
          {
            p_student_id:
              params.alunoId,

            p_amount:
              params.valor,

            p_protocol:
              params.protocolo,
          }
        );

      if (error) {
        console.error(
          'Erro ao solicitar depósito:',
          error
        );

        throw new Error(
          error.message ||
            'Não foi possível solicitar o depósito.'
        );
      }

      operationId =
        (data as OperationRow)
          ?.id;
    } else if (
      params.tipo === 'SAQUE'
    ) {
      const { data, error } =
        await supabase.rpc(
          'request_withdrawal',
          {
            p_student_id:
              params.alunoId,

            p_amount:
              params.valor,

            p_protocol:
              params.protocolo,
          }
        );

      if (error) {
        console.error(
          'Erro ao solicitar saque:',
          error
        );

        throw new Error(
          error.message ||
            'Não foi possível solicitar o saque.'
        );
      }

      operationId =
        (data as OperationRow)
          ?.id;
    } else if (
      params.tipo ===
      'RESGATE_INVESTIMENTO'
    ) {
      const investimentoId =
        params.detalhes
          ?.investimentoId;

      if (!investimentoId) {
        throw new Error(
          'Investimento não informado para o resgate.'
        );
      }

      const { data, error } =
        await supabase.rpc(
          'request_investment_redemption',
          {
            p_investment_id:
              investimentoId,

            p_protocol:
              params.protocolo,
          }
        );

      if (error) {
        console.error(
          'Erro ao solicitar resgate:',
          error
        );

        throw new Error(
          error.message ||
            'Não foi possível solicitar o resgate.'
        );
      }

      operationId =
        (data as OperationRow)
          ?.id;
    } else {
      throw new Error(
        'Tipo de operação não suportado.'
      );
    }

    /*
     * As RPCs retornam a própria linha
     * da tabela operations.
     *
     * Caso o ID não venha por algum
     * motivo, usamos o protocolo para
     * localizar a operação criada.
     */
    if (!operationId) {
      const { data, error } =
        await supabase
          .from('operations')
          .select('id')
          .eq(
            'protocolo',
            params.protocolo
          )
          .single();

      if (error || !data) {
        console.error(
          'Operação criada, mas não localizada:',
          error
        );

        throw new Error(
          'A operação foi registrada, mas não pôde ser recarregada.'
        );
      }

      operationId =
        data.id;
    }

    if (!operationId) {
  throw new Error(
    'Não foi possível identificar a operação criada.'
  );
}

const operation =
  await this.getById(
    operationId
  );

    if (!operation) {
      throw new Error(
        'Operação registrada, mas não encontrada.'
      );
    }

    return operation;
  }

  /**
   * Confirma a operação pelo banco.
   *
   * O navegador NÃO altera saldo
   * diretamente.
   */
  async confirmOperation(
    operationId: string
  ): Promise<Operation> {
    const { error } =
      await supabase.rpc(
        'confirm_operation',
        {
          p_operation_id:
            operationId,
        }
      );

    if (error) {
      console.error(
        'Erro ao confirmar operação:',
        error
      );

      throw new Error(
        error.message ||
          'Não foi possível confirmar a operação.'
      );
    }

    const operation =
      await this.getById(
        operationId
      );

    if (!operation) {
      throw new Error(
        'Operação confirmada, mas não foi possível recarregá-la.'
      );
    }

    return operation;
  }

  /**
   * Cancela uma operação pendente.
   */
  async cancelOperation(
    operationId: string
  ): Promise<Operation> {
    const { error } =
      await supabase.rpc(
        'cancel_operation',
        {
          p_operation_id:
            operationId,
        }
      );

    if (error) {
      console.error(
        'Erro ao cancelar operação:',
        error
      );

      throw new Error(
        error.message ||
          'Não foi possível cancelar a operação.'
      );
    }

    const operation =
      await this.getById(
        operationId
      );

    if (!operation) {
      throw new Error(
        'Operação cancelada, mas não foi possível recarregá-la.'
      );
    }

    return operation;
  }
}

export const operationRepository =
  new OperationRepository();