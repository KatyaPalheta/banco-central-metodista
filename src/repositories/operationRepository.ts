import { Operation, OperationType, TurmaId } from '../domain/types';
import { studentRepository } from './studentRepository';
import { investmentRepository } from './investmentRepository';

const STORAGE_KEY = 'bcem_operations_v1';

class OperationRepository {
  private getStorage(): Operation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveStorage(ops: Operation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    } catch (err) {
      console.error('Falha ao salvar operações no localStorage', err);
    }
  }

  async getAll(): Promise<Operation[]> {
    return this.getStorage();
  }

  async getPendingByTurma(turma?: TurmaId): Promise<Operation[]> {
    const list = this.getStorage();
    return list.filter(
      (op) => op.status === 'PENDENTE' && (!turma || op.turma === turma)
    );
  }

  async getPendingByStudent(studentId: string): Promise<Operation[]> {
    const list = this.getStorage();
    return list.filter(
      (op) => op.status === 'PENDENTE' && op.alunoId === studentId
    );
  }

  /**
   * Calcula o total de saques pendentes de um aluno.
   * Regra do edital: previne que o aluno solicite saques sucessivos
   * que juntos ultrapassem o saldo confirmado.
   */
  async getPendingWithdrawalsTotal(studentId: string): Promise<number> {
    const list = this.getStorage();
    return list
      .filter(
        (op) =>
          op.status === 'PENDENTE' &&
          op.alunoId === studentId &&
          op.tipo === 'SAQUE'
      )
      .reduce((acc, curr) => acc + curr.valor, 0);
  }

  /**
   * Registra uma nova operação pendente (chamada APÓS o sucesso da impressão térmica)
   */
  async createPendingOperation(params: {
    protocolo: string;
    alunoId: string;
    alunoNome: string;
    turma: TurmaId;
    numeroConta: string;
    tipo: OperationType;
    valor: number;
    detalhes?: Operation['detalhes'];
  }): Promise<Operation> {
    const list = this.getStorage();
    const newOp: Operation = {
      id: `op-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolo: params.protocolo,
      alunoId: params.alunoId,
      alunoNome: params.alunoNome,
      turma: params.turma,
      numeroConta: params.numeroConta,
      tipo: params.tipo,
      valor: params.valor,
      dataHora: new Date().toISOString(),
      status: 'PENDENTE',
      detalhes: params.detalhes,
    };

    list.unshift(newOp);
    this.saveStorage(list);
    return newOp;
  }

  /**
   * Confirmação da operação pelo Professor:
   * - Depósito: soma ao saldo do aluno
   * - Saque: subtrai do saldo do aluno
   * - Resgate: efetiva o resgate no investmentRepository e soma o valor líquido ao saldo
   * - Atualiza status da operação para CONFIRMADA
   */
  async confirmOperation(operationId: string): Promise<Operation> {
    const list = this.getStorage();
    const index = list.findIndex((op) => op.id === operationId);
    if (index === -1) {
      throw new Error('Operação não encontrada.');
    }

    const op = list[index];
    if (op.status !== 'PENDENTE') {
      throw new Error('Apenas operações pendentes podem ser confirmadas.');
    }

    if (op.tipo === 'DEPOSITO') {
      await studentRepository.updateBalance(op.alunoId, op.valor);
    } else if (op.tipo === 'SAQUE') {
      await studentRepository.updateBalance(op.alunoId, -op.valor);
    } else if (op.tipo === 'RESGATE_INVESTIMENTO') {
      const valorCredito = op.detalhes?.valorLiquido ?? op.valor;
      if (op.detalhes?.investimentoId) {
        await investmentRepository.finalizeRedemption(op.detalhes.investimentoId);
      }
      await studentRepository.updateBalance(op.alunoId, valorCredito);
    }

    op.status = 'CONFIRMADA';
    list[index] = op;
    this.saveStorage(list);
    return op;
  }
}

export const operationRepository = new OperationRepository();
