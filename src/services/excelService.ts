import * as XLSX from 'xlsx';
import { ImportSummary, TurmaId } from '../domain/types';
import { normalizeAccountNumber, normalizeStudentName } from '../utils/normalization';
import { studentRepository } from '../repositories/studentRepository';

const VALID_TURMAS: TurmaId[] = ['401', '402', '501', '502'];

/**
 * Analisa o arquivo Excel (.xlsx) selecionado e produz um resumo antes da efetivação
 */
export async function parseExcelImport(file: File): Promise<ImportSummary> {
  const fileName = file.name.trim();
  // Extrai nome sem extensão
  const baseName = fileName.replace(/\.[^/.]+$/, '').trim();

  // Valida turma pelo nome do arquivo
  let turmaIdentificada: TurmaId | null = null;
  if (VALID_TURMAS.includes(baseName as TurmaId)) {
    turmaIdentificada = baseName as TurmaId;
  }

  const summary: ImportSummary = {
    turmaIdentificada,
    nomeArquivo: fileName,
    totalLinhasLidas: 0,
    registrosValidos: [],
    erros: [],
  };

  if (!turmaIdentificada) {
    summary.erros.push(
      `O nome do arquivo "${fileName}" não corresponde a uma turma válida. Utilize 401.xlsx, 402.xlsx, 501.xlsx ou 502.xlsx.`
    );
    return summary;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      summary.erros.push('A planilha está vazia.');
      return summary;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Converte planilha em array de arrays
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    summary.totalLinhasLidas = rawData.length;

    if (rawData.length === 0) {
      summary.erros.push('Nenhum registro encontrado na primeira aba da planilha.');
      return summary;
    }

    // Identifica colunas aceitando variações de caixa ou acentuação
    const existingStudents = await studentRepository.getAll();
    const existingAccounts = new Set(
      existingStudents.map((s) => normalizeAccountNumber(s.numeroConta))
    );
    const seenAccountsInFile = new Set<string>();

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 2; // Linha no Excel (considerando cabeçalho na linha 1)

      // Procura chaves equivalentes a ALUNO e NUMERO DE CONTA
      let rawAluno = '';
      let rawConta = '';

      for (const [key, value] of Object.entries(row)) {
        const cleanKey = key.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (cleanKey === 'ALUNO' || cleanKey === 'NOME' || cleanKey === 'NOME DO ALUNO') {
          rawAluno = String(value);
        } else if (
          cleanKey === 'NUMERO DE CONTA' ||
          cleanKey === 'NUMERO DA CONTA' ||
          cleanKey === 'CONTA' ||
          cleanKey === 'NUMERODECONTA'
        ) {
          rawConta = String(value);
        }
      }

      const nomeNormalizado = normalizeStudentName(rawAluno);
      const contaNormalizada = normalizeAccountNumber(rawConta);

      if (!nomeNormalizado && !contaNormalizada) {
        // Linha em branco, ignora silenciosamente
        continue;
      }

      if (!nomeNormalizado) {
        summary.erros.push(`Linha ${rowNum}: Nome do aluno não informado.`);
        continue;
      }

      if (!contaNormalizada) {
        summary.erros.push(`Linha ${rowNum}: Número de conta não informado para "${nomeNormalizado}".`);
        continue;
      }

      if (seenAccountsInFile.has(contaNormalizada)) {
        summary.erros.push(
          `Linha ${rowNum}: Conta duplicada no arquivo (${contaNormalizada} - "${nomeNormalizado}").`
        );
        continue;
      }

      if (existingAccounts.has(contaNormalizada)) {
        summary.erros.push(
          `Linha ${rowNum}: A conta ${contaNormalizada} já existe no sistema (${nomeNormalizado}).`
        );
        continue;
      }

      seenAccountsInFile.add(contaNormalizada);
      summary.registrosValidos.push({
        id: `alu-${turmaIdentificada}-${Date.now().toString(36)}-${i}`,
        nome: nomeNormalizado,
        turma: turmaIdentificada,
        numeroConta: contaNormalizada,
        saldo: 0, // Inicia sempre com saldo zero
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    summary.erros.push(`Erro ao processar planilha: ${error.message || 'Arquivo corrompido ou formato inválido'}`);
  }

  return summary;
}

/**
 * Efetiva a importação dos registros válidos após confirmação do usuário
 */
export async function executeImport(summary: ImportSummary): Promise<{
  success: boolean;
  importedCount: number;
  errors: string[];
}> {
  if (!summary.turmaIdentificada || summary.registrosValidos.length === 0) {
    return {
      success: false,
      importedCount: 0,
      errors: ['Nenhum registro válido para importar.'],
    };
  }

  const result = await studentRepository.importBatch(
    summary.turmaIdentificada,
    summary.registrosValidos.map((s) => ({
      nome: s.nome,
      numeroConta: s.numeroConta,
    }))
  );

  return {
    success: result.addedCount > 0,
    importedCount: result.addedCount,
    errors: result.errors,
  };
}
