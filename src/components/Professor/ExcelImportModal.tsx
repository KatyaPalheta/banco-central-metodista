import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { ImportSummary } from '../../domain/types';
import { parseExcelImport, executeImport } from '../../services/excelService';

interface ExcelImportModalProps {
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [applying, setApplying] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setLoading(true);
    setFeedbackError(null);
    try {
      const parsedSummary = await parseExcelImport(selected);
      setSummary(parsedSummary);
    } catch (err: unknown) {
      const error = err as Error;
      setFeedbackError(error.message || 'Erro ao processar planilha Excel.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!summary) return;
    setApplying(true);
    setFeedbackError(null);
    try {
      const res = await executeImport(summary);
      if (res.success) {
        onImportSuccess(res.importedCount);
      } else {
        setFeedbackError(res.errors.join(' | ') || 'Nenhum registro foi importado.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setFeedbackError(error.message || 'Falha ao salvar dados importados.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-sky-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-fredoka text-2xl font-bold text-slate-900">
              Importar Turma via Excel
            </h3>
            <p className="text-xs text-slate-500">
              Arquivos no formato: 401.xlsx, 402.xlsx, 501.xlsx, 502.xlsx
            </p>
          </div>
        </div>

        {/* Informação sobre regras da importação */}
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-900 mb-6 space-y-1">
          <p><strong>Regras oficiais de importação:</strong></p>
          <ul className="list-disc list-inside space-y-0.5 text-sky-800">
            <li>O nome do arquivo define a turma (ex: <strong>401.xlsx</strong>).</li>
            <li>Colunas obrigatórias: <strong>ALUNO</strong> e <strong>NUMERO DE CONTA</strong>.</li>
            <li>Nomes serão normalizados automaticamente (maiúsculas, sem acentos, Ç vira C).</li>
            <li>Novos alunos importados iniciam sempre com saldo zero.</li>
          </ul>
        </div>

        {/* Seletor de Arquivo */}
        {!summary && (
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-sky-300 hover:border-blue-500 bg-sky-50/50 hover:bg-sky-50 rounded-3xl p-8 text-center cursor-pointer transition-colors">
              <Upload className="w-10 h-10 text-sky-600 mb-3" />
              <span className="font-fredoka font-bold text-base text-slate-800 mb-1">
                Clique para selecionar a planilha (.xlsx)
              </span>
              <span className="text-xs text-slate-500">
                Arquivos suportados: 401.xlsx, 402.xlsx, 501.xlsx, 502.xlsx
              </span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-blue-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processando planilha...
              </div>
            )}
          </div>
        )}

        {/* Resumo da Importação */}
        {summary && (
          <div className="mb-6 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Arquivo Selecionado:</span>
                <span className="font-mono font-bold text-slate-800">{summary.nomeArquivo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Turma Identificada:</span>
                <span className="font-fredoka text-base font-bold text-blue-700">
                  {summary.turmaIdentificada ? `Turma ${summary.turmaIdentificada}` : 'Não reconhecida'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Linhas Lidas:</span>
                <span className="font-bold text-slate-800">{summary.totalLinhasLidas}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Registros Válidos para Importar:</span>
                <span>{summary.registrosValidos.length}</span>
              </div>
            </div>

            {/* Lista de Erros ou Inconsistências se houver */}
            {summary.erros.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1 max-h-36 overflow-y-auto">
                <div className="font-bold text-amber-900 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Avisos e inconsistências ({summary.erros.length}):</span>
                </div>
                {summary.erros.map((err, idx) => (
                  <div key={idx} className="text-amber-800 pl-4">
                    • {err}
                  </div>
                ))}
              </div>
            )}

            {/* Amostra dos registros válidos */}
            {summary.registrosValidos.length > 0 && (
              <div className="text-xs text-slate-500">
                <span className="font-bold">Amostra de alunos a cadastrar: </span>
                {summary.registrosValidos.slice(0, 4).map((s) => s.nome).join(', ')}
                {summary.registrosValidos.length > 4 && ` e mais ${summary.registrosValidos.length - 4} alunos.`}
              </div>
            )}
          </div>
        )}

        {feedbackError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {feedbackError}
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
          >
            Cancelar
          </button>

          {summary && summary.registrosValidos.length > 0 && (
            <button
              type="button"
              disabled={applying}
              onClick={handleConfirmImport}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-fredoka font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer"
            >
              {applying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  CONFIRMAR E IMPORTAR {summary.registrosValidos.length} ALUNOS
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
