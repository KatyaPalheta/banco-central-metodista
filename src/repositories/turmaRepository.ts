import { supabase } from '../lib/supabase';

export interface Turma {
  codigo: string;
  ativo: boolean;
}

class TurmaRepository {
  async getAll(): Promise<Turma[]> {
    const { data, error } = await supabase
      .from('turmas')
      .select('codigo, ativo')
      .eq('ativo', true)
      .order('codigo');

    if (error) {
      console.error(
        'Erro ao carregar turmas:',
        error
      );

      throw new Error(
        'Não foi possível carregar as turmas.'
      );
    }

    return (data ?? []) as Turma[];
  }

  async create(
    codigo: string
  ): Promise<Turma> {
    const codigoNormalizado =
      codigo.trim();

    if (!/^\d{3}$/.test(codigoNormalizado)) {
      throw new Error(
        'O código da turma deve conter exatamente 3 números.'
      );
    }

    const { data, error } =
      await supabase.rpc(
        'create_turma',
        {
          p_codigo: codigoNormalizado,
        }
      );

    if (error) {
      console.error(
        'Erro ao criar turma:',
        error
      );

      if (
        error.message.includes(
          'já está cadastrada'
        )
      ) {
        throw new Error(
          `A turma ${codigoNormalizado} já está cadastrada.`
        );
      }

      throw new Error(
        'Não foi possível criar a turma.'
      );
    }

    const turma = Array.isArray(data)
      ? data[0]
      : data;

    if (!turma) {
      throw new Error(
        'A turma foi criada, mas não foi possível recuperar os dados.'
      );
    }

    return turma as Turma;
  }
}

export const turmaRepository =
  new TurmaRepository();