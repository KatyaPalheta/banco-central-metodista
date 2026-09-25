import { supabase } from '../lib/supabase';

import {
  Student,
  TurmaId,
} from '../domain/types';

import {
  normalizeAccountNumber,
  normalizeStudentName,
} from '../utils/normalization';

interface StudentRow {
  id: string;
  nome: string;
  turma: string;
  numero_conta: string;
  saldo: number | string;
  ativo: boolean;
}

const mapStudent = (
  row: StudentRow
): Student => ({
  id: row.id,
  nome: row.nome,
  turma: row.turma as TurmaId,
  numeroConta: row.numero_conta,
  saldo: Number(row.saldo),
});

class StudentRepository {

  async getAll(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select(
        'id, nome, turma, numero_conta, saldo, ativo'
      )
      .eq('ativo', true)
      .order('turma')
      .order('nome');

    if (error) {
      console.error(
        'Erro ao carregar alunos:',
        error
      );

      throw new Error(
        'Não foi possível carregar os alunos.'
      );
    }

    return (data ?? []).map(
      (row) => mapStudent(row as StudentRow)
    );
  }


  async getByTurma(
    turma?: TurmaId
  ): Promise<Student[]> {

    if (!turma) {
      return this.getAll();
    }

    const { data, error } = await supabase
      .from('students')
      .select(
        'id, nome, turma, numero_conta, saldo, ativo'
      )
      .eq('ativo', true)
      .eq('turma', turma)
      .order('nome');

    if (error) {
      console.error(
        'Erro ao carregar turma:',
        error
      );

      throw new Error(
        'Não foi possível carregar a turma.'
      );
    }

    return (data ?? []).map(
      (row) => mapStudent(row as StudentRow)
    );
  }


  async getById(
    id: string
  ): Promise<Student | null> {

    const { data, error } = await supabase
      .from('students')
      .select(
        'id, nome, turma, numero_conta, saldo, ativo'
      )
      .eq('id', id)
      .eq('ativo', true)
      .maybeSingle();

    if (error) {
      console.error(
        'Erro ao buscar aluno:',
        error
      );

      throw new Error(
        'Não foi possível buscar o aluno.'
      );
    }

    if (!data) {
      return null;
    }

    return mapStudent(
      data as StudentRow
    );
  }


  async getByAccountNumber(
    accountNumber: string
  ): Promise<Student | null> {

    const normalizedAccount =
      normalizeAccountNumber(accountNumber);

    if (!normalizedAccount) {
      return null;
    }

    const { data, error } = await supabase
      .from('students')
      .select(
        'id, nome, turma, numero_conta, saldo, ativo'
      )
      .eq(
        'numero_conta',
        normalizedAccount
      )
      .eq('ativo', true)
      .maybeSingle();

    if (error) {
      console.error(
        'Erro ao buscar conta:',
        error
      );

      throw new Error(
        'Não foi possível buscar a conta.'
      );
    }

    if (!data) {
      return null;
    }

    return mapStudent(
      data as StudentRow
    );
  }


  async searchByTurmaAndName(
    turma: TurmaId,
    nameQuery: string
  ): Promise<Student[]> {

    const normalizedQuery =
      normalizeStudentName(nameQuery);

    if (!normalizedQuery) {
      return [];
    }

    const { data, error } = await supabase
      .from('students')
      .select(
        'id, nome, turma, numero_conta, saldo, ativo'
      )
      .eq('ativo', true)
      .eq('turma', turma)
      .ilike(
        'nome_normalizado',
        `%${normalizedQuery}%`
      )
      .order('nome');

    if (error) {
      console.error(
        'Erro ao pesquisar aluno:',
        error
      );

      throw new Error(
        'Não foi possível pesquisar alunos.'
      );
    }

    return (data ?? []).map(
      (row) => mapStudent(row as StudentRow)
    );
  }


  private async createStudentRecord(
    nome: string,
    turma: TurmaId,
    numeroConta: string
  ): Promise<{
    success: boolean;
    id?: string;
    error?: string;
  }> {

    const { data, error } =
      await supabase.rpc(
        'create_student',
        {
          p_nome: nome,
          p_nome_normalizado: nome,
          p_turma: turma,
          p_numero_conta: numeroConta,
        }
      );

    if (error) {
      console.error(
        'Erro ao cadastrar aluno:',
        error
      );

      if (
        error.code === '23505' ||
        error.message
          .toLowerCase()
          .includes('duplicate')
      ) {
        return {
          success: false,
          error:
            `A conta ${numeroConta} já está cadastrada.`,
        };
      }

      return {
        success: false,
        error:
          'Não foi possível cadastrar o aluno.',
      };
    }

    return {
      success: true,
      id: String(data),
    };
  }


  async addStudent(data: {
    nome: string;
    turma: TurmaId;
    numeroConta: string;
  }): Promise<{
    success: boolean;
    student?: Student;
    error?: string;
  }> {

    const normalizedName =
      normalizeStudentName(data.nome);

    const normalizedAccount =
      normalizeAccountNumber(
        data.numeroConta
      );

    if (!normalizedName) {
      return {
        success: false,
        error:
          'O nome do aluno é obrigatório.',
      };
    }

    if (!normalizedAccount) {
      return {
        success: false,
        error:
          'O número da conta é obrigatório.',
      };
    }

    const result =
      await this.createStudentRecord(
        normalizedName,
        data.turma,
        normalizedAccount
      );

    if (!result.success || !result.id) {
      return {
        success: false,
        error: result.error,
      };
    }

    const student =
      await this.getById(result.id);

    if (!student) {
      return {
        success: false,
        error:
          'Aluno cadastrado, mas não foi possível recarregá-lo.',
      };
    }

    return {
      success: true,
      student,
    };
  }


  async importBatch(
    turma: TurmaId,
    records: Array<{
      nome: string;
      numeroConta: string;
    }>
  ): Promise<{
    addedCount: number;
    errors: string[];
  }> {

    const errors: string[] = [];
    let addedCount = 0;

    const existingStudents =
      await this.getAll();

    const existingAccounts =
      new Set(
        existingStudents.map(
          (student) =>
            normalizeAccountNumber(
              student.numeroConta
            )
        )
      );

    for (const item of records) {

      const normalizedName =
        normalizeStudentName(
          item.nome
        );

      const normalizedAccount =
        normalizeAccountNumber(
          item.numeroConta
        );

      if (
        !normalizedName ||
        !normalizedAccount
      ) {
        errors.push(
          `Registro inválido ignorado: "${item.nome}" - "${item.numeroConta}"`
        );

        continue;
      }

      if (
        existingAccounts.has(
          normalizedAccount
        )
      ) {
        errors.push(
          `Conta duplicada ignorada: ${normalizedAccount} (${normalizedName})`
        );

        continue;
      }

      const result =
        await this.createStudentRecord(
          normalizedName,
          turma,
          normalizedAccount
        );

      if (!result.success) {
        errors.push(
          `${normalizedName}: ${
            result.error ??
            'Erro ao cadastrar.'
          }`
        );

        continue;
      }

      existingAccounts.add(
        normalizedAccount
      );

      addedCount++;
    }

    return {
      addedCount,
      errors,
    };
  }


  /**
   * O saldo não pode mais ser alterado
   * diretamente pelo navegador.
   *
   * Depósitos, saques, investimentos
   * e resgates usam as funções
   * financeiras do Supabase.
   */
  async updateBalance(
    _studentId: string,
    _delta: number
  ): Promise<Student> {

    throw new Error(
      'Alteração direta de saldo desativada. Use as funções financeiras do Supabase.'
    );
  }


  /**
   * A base oficial não utiliza mais
   * alunos mockados em localStorage.
   */
  resetToDefault(): void {
    console.warn(
      'resetToDefault desativado: os alunos agora estão armazenados no Supabase.'
    );
  }
}

export const studentRepository =
  new StudentRepository();