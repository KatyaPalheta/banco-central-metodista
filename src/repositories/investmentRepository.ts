import { InvestmentOptionId, InvestmentRecord } from '../domain/types';
import { INVESTMENT_CONFIGS } from '../services/investmentConfig';
import { studentRepository } from './studentRepository';

const STORAGE_KEY = 'bcem_investments_v1';

const INITIAL_MOCK_INVESTMENTS: InvestmentRecord[] = [
  {
    id: 'inv-mock-01',
    alunoId: 'alu-401-01', // Lucas Silva Pereira
    opcaoId: 'OPCAO_1',
    opcaoNome: INVESTMENT_CONFIGS.OPCAO_1.nome,
    valorAplicado: 20.0,
    dataAplicacao: new Date(Date.now() - 15 * 86400000).toISOString(),
    dataVencimento: new Date(Date.now() + 15 * 86400000).toISOString(),
    status: 'ATIVO',
    rendimentoAcumulado: 0.5,
    valorResgateCalculado: 20.5,
    penalidadeAplicada: 0,
  },
  {
    id: 'inv-mock-02',
    alunoId: 'alu-501-01', // Joao Pedro
    opcaoId: 'OPCAO_3',
    opcaoNome: INVESTMENT_CONFIGS.OPCAO_3.nome,
    valorAplicado: 50.0,
    dataAplicacao: new Date(Date.now() - 20 * 86400000).toISOString(),
    dataVencimento: new Date(Date.now() + 40 * 86400000).toISOString(),
    status: 'ATIVO',
    rendimentoAcumulado: 10.0,
    valorResgateCalculado: 55.0,
    penalidadeAplicada: 5.0,
  },
];

class InvestmentRepository {
  private getStorage(): InvestmentRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_INVESTMENTS));
        return INITIAL_MOCK_INVESTMENTS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_MOCK_INVESTMENTS;
    }
  }

  private saveStorage(invs: InvestmentRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invs));
    } catch (err) {
      console.error('Falha ao salvar investimentos no localStorage', err);
    }
  }

  async getAll(): Promise<InvestmentRecord[]> {
    return this.getStorage();
  }

  async getByStudent(alunoId: string): Promise<InvestmentRecord[]> {
    const list = this.getStorage();
    return list.filter((inv) => inv.alunoId === alunoId);
  }

  async getActiveByStudent(alunoId: string): Promise<InvestmentRecord[]> {
    const list = this.getStorage();
    return list.filter((inv) => inv.alunoId === alunoId && inv.status === 'ATIVO');
  }

  async getById(id: string): Promise<InvestmentRecord | null> {
    const list = this.getStorage();
    return list.find((inv) => inv.id === id) || null;
  }

  /**
   * Aplicação em Investimento:
   * Concluída imediatamente no Caixa (não vai para fila do professor).
   * Reduz o saldo disponível do aluno imediatamente.
   */
  async applyInvestment(
    alunoId: string,
    opcaoId: InvestmentOptionId,
    valor: number
  ): Promise<InvestmentRecord> {
    const student = await studentRepository.getById(alunoId);
    if (!student) {
      throw new Error('Aluno não encontrado.');
    }
    if (student.saldo < valor) {
      throw new Error('Saldo insuficiente para esta aplicação.');
    }

    // Debita o saldo imediatamente
    await studentRepository.updateBalance(alunoId, -valor);

    const config = INVESTMENT_CONFIGS[opcaoId];
    const now = new Date();
    const dataVencimento = new Date(
      now.getTime() + (config.prazoMinimoDias || 30) * 86400000
    );

    const rendimentoTeorico = (valor * config.rendimentoTaxaPercentual) / 100;

    const newRecord: InvestmentRecord = {
      id: `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      alunoId,
      opcaoId,
      opcaoNome: config.nome,
      valorAplicado: valor,
      dataAplicacao: now.toISOString(),
      dataVencimento: dataVencimento.toISOString(),
      status: 'ATIVO',
      rendimentoAcumulado: Number(rendimentoTeorico.toFixed(2)),
      valorResgateCalculado: Number((valor + rendimentoTeorico).toFixed(2)),
      penalidadeAplicada: 0,
    };

    const list = this.getStorage();
    list.unshift(newRecord);
    this.saveStorage(list);
    return newRecord;
  }

  /**
   * Marca investimento com solicitação de resgate pendente
   */
  async markRedemptionPending(
    investmentId: string,
    protocolo: string,
    valorResgate: number,
    penalidade: number
  ): Promise<InvestmentRecord> {
    const list = this.getStorage();
    const index = list.findIndex((inv) => inv.id === investmentId);
    if (index === -1) {
      throw new Error('Investimento não encontrado.');
    }

    list[index] = {
      ...list[index],
      status: 'RESGATE_PENDENTE',
      protocoloResgate: protocolo,
      valorResgateCalculado: valorResgate,
      penalidadeAplicada: penalidade,
    };

    this.saveStorage(list);
    return list[index];
  }

  /**
   * Efetivação do resgate quando o professor confirma a operação
   */
  async finalizeRedemption(investmentId: string): Promise<InvestmentRecord> {
    const list = this.getStorage();
    const index = list.findIndex((inv) => inv.id === investmentId);
    if (index === -1) {
      throw new Error('Investimento não encontrado.');
    }

    list[index] = {
      ...list[index],
      status: 'RESGATADO',
    };

    this.saveStorage(list);
    return list[index];
  }
}

export const investmentRepository = new InvestmentRepository();
