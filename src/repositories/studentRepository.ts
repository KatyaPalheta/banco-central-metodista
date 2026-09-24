import { Student, TurmaId } from '../domain/types';
import { normalizeAccountNumber, normalizeStudentName } from '../utils/normalization';

const STORAGE_KEY = 'bcem_students_v1';

/**
 * Base inicial mockada de alunos para as turmas 401, 402, 501 e 502
 * Nomes armazenados rigorosamente de acordo com as regras:
 * - Todas maiúsculas
 * - Sem acentos
 * - Ç convertido para C
 * - Saldos variados para testes
 */
const INITIAL_MOCK_STUDENTS: Student[] = [
  // Turma 401 (Manhã)
  { id: 'alu-401-01', nome: 'LUCAS SILVA PEREIRA', turma: '401', numeroConta: '40101', saldo: 45.0 },
  { id: 'alu-401-02', nome: 'MARIA EDUARDA SANTOS', turma: '401', numeroConta: '40102', saldo: 120.0 },
  { id: 'alu-401-03', nome: 'GABRIEL ALVES CONCEICAO', turma: '401', numeroConta: '40103', saldo: 20.0 },
  { id: 'alu-401-04', nome: 'SOPHIA LIMA RODRIGUES', turma: '401', numeroConta: '40104', saldo: 75.0 },
  { id: 'alu-401-05', nome: 'PEDRO HENRIQUE ROCHA', turma: '401', numeroConta: '40105', saldo: 10.0 },

  // Turma 402 (Tarde)
  { id: 'alu-402-01', nome: 'ENZO GABRIEL FERREIRA', turma: '402', numeroConta: '40201', saldo: 35.0 },
  { id: 'alu-402-02', nome: 'JULIA ALMEIDA COSTA', turma: '402', numeroConta: '40202', saldo: 90.0 },
  { id: 'alu-402-03', nome: 'MATHEUS DIAS MARTINS', turma: '402', numeroConta: '40203', saldo: 15.0 },
  { id: 'alu-402-04', nome: 'ALICE NOGUEIRA SOUSA', turma: '402', numeroConta: '40204', saldo: 60.0 },

  // Turma 501 (Manhã)
  { id: 'alu-501-01', nome: 'JOAO PEDRO DA SILVEIRA', turma: '501', numeroConta: '50101', saldo: 150.0 },
  { id: 'alu-501-02', nome: 'BEATRIZ FRANCA CARDOSO', turma: '501', numeroConta: '50102', saldo: 85.0 },
  { id: 'alu-501-03', nome: 'DANIEL MOURA BARBOSA', turma: '501', numeroConta: '50103', saldo: 25.0 },
  { id: 'alu-501-04', nome: 'LARA GONCALVES RIBEIRO', turma: '501', numeroConta: '50104', saldo: 110.0 },

  // Turma 502 (Tarde)
  { id: 'alu-502-01', nome: 'ARTHUR VIEIRA TEIXEIRA', turma: '502', numeroConta: '50201', saldo: 50.0 },
  { id: 'alu-502-02', nome: 'VALENTINA CAMPOS LOPES', turma: '502', numeroConta: '50202', saldo: 130.0 },
  { id: 'alu-502-03', nome: 'CAIO AZEVEDO FREITAS', turma: '502', numeroConta: '50203', saldo: 40.0 },
  { id: 'alu-502-04', nome: 'HELENA PINTO ARAUJO', turma: '502', numeroConta: '50204', saldo: 95.0 },
];

class StudentRepository {
  private getStorage(): Student[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_STUDENTS));
        return INITIAL_MOCK_STUDENTS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_MOCK_STUDENTS;
    }
  }

  private saveStorage(students: Student[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch (err) {
      console.error('Falha ao salvar dados de estudantes no localStorage', err);
    }
  }

  async getAll(): Promise<Student[]> {
    return this.getStorage();
  }

  async getByTurma(turma?: TurmaId): Promise<Student[]> {
    const list = this.getStorage();
    if (!turma) return list;
    return list.filter((s) => s.turma === turma);
  }

  async getById(id: string): Promise<Student | null> {
    const list = this.getStorage();
    return list.find((s) => s.id === id) || null;
  }

  async getByAccountNumber(accountNumber: string): Promise<Student | null> {
    const norm = normalizeAccountNumber(accountNumber);
    if (!norm) return null;
    const list = this.getStorage();
    return list.find((s) => normalizeAccountNumber(s.numeroConta) === norm) || null;
  }

  /**
   * Busca por Turma + Nome (aceita pesquisa parcial, sem acento, maiúsculas/minúsculas)
   */
  async searchByTurmaAndName(turma: TurmaId, nameQuery: string): Promise<Student[]> {
    const normQuery = normalizeStudentName(nameQuery);
    if (!normQuery) return [];
    const list = this.getStorage();
    return list.filter((s) => s.turma === turma && s.nome.includes(normQuery));
  }

  /**
   * Adiciona aluno manualmente
   */
  async addStudent(data: {
    nome: string;
    turma: TurmaId;
    numeroConta: string;
  }): Promise<{ success: boolean; student?: Student; error?: string }> {
    const list = this.getStorage();
    const normalizedName = normalizeStudentName(data.nome);
    const normalizedAccount = normalizeAccountNumber(data.numeroConta);

    if (!normalizedName) {
      return { success: false, error: 'O nome do aluno é obrigatório.' };
    }
    if (!normalizedAccount) {
      return { success: false, error: 'O número da conta é obrigatório.' };
    }

    const accountExists = list.some(
      (s) => normalizeAccountNumber(s.numeroConta) === normalizedAccount
    );
    if (accountExists) {
      return { success: false, error: `A conta ${normalizedAccount} já está cadastrada.` };
    }

    const newStudent: Student = {
      id: `alu-${data.turma}-${Date.now().toString(36)}`,
      nome: normalizedName,
      turma: data.turma,
      numeroConta: normalizedAccount,
      saldo: 0, // Novos alunos iniciam sempre com saldo zero
    };

    list.push(newStudent);
    this.saveStorage(list);
    return { success: true, student: newStudent };
  }

  /**
   * Importação em lote a partir do Excel
   */
  async importBatch(
    turma: TurmaId,
    records: Array<{ nome: string; numeroConta: string }>
  ): Promise<{ addedCount: number; errors: string[] }> {
    const list = this.getStorage();
    const errors: string[] = [];
    let addedCount = 0;

    const existingAccounts = new Set(list.map((s) => normalizeAccountNumber(s.numeroConta)));

    for (const item of records) {
      const normName = normalizeStudentName(item.nome);
      const normAcc = normalizeAccountNumber(item.numeroConta);

      if (!normName || !normAcc) {
        errors.push(`Registro inválido ignorado: "${item.nome}" - "${item.numeroConta}"`);
        continue;
      }

      if (existingAccounts.has(normAcc)) {
        errors.push(`Conta duplicada ignorada: ${normAcc} (${normName})`);
        continue;
      }

      existingAccounts.add(normAcc);
      const newStudent: Student = {
        id: `alu-${turma}-${Date.now().toString(36)}-${addedCount}`,
        nome: normName,
        turma,
        numeroConta: normAcc,
        saldo: 0,
      };
      list.push(newStudent);
      addedCount++;
    }

    if (addedCount > 0) {
      this.saveStorage(list);
    }

    return { addedCount, errors };
  }

  /**
   * Atualiza o saldo confirmado de um aluno (somando ou subtraindo)
   */
  async updateBalance(studentId: string, delta: number): Promise<Student> {
    const list = this.getStorage();
    const index = list.findIndex((s) => s.id === studentId);
    if (index === -1) {
      throw new Error(`Estudante ID ${studentId} não encontrado.`);
    }

    const currentSaldo = list[index].saldo;
    const novoSaldo = Number((currentSaldo + delta).toFixed(2));
    if (novoSaldo < 0) {
      throw new Error(`Saldo insuficiente para realizar a operação.`);
    }

    list[index] = { ...list[index], saldo: novoSaldo };
    this.saveStorage(list);
    return list[index];
  }

  /**
   * Restaura dados iniciais (útil para testes)
   */
  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_STUDENTS));
  }
}

export const studentRepository = new StudentRepository();
