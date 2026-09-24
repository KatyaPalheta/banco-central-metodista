import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2 } from 'lucide-react';
import { TurmaId } from '../../domain/types';
import { studentRepository } from '../../repositories/studentRepository';

interface AddStudentModalProps {
  initialTurma?: TurmaId;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  initialTurma = '401',
  onClose,
  onSuccess,
}) => {
  const [turma, setTurma] = useState<TurmaId>(initialTurma);
  const [nome, setNome] = useState('');
  const [numeroConta, setNumeroConta] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await studentRepository.addStudent({
        turma,
        nome,
        numeroConta,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Não foi possível cadastrar o aluno.');
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao cadastrar aluno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-sky-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-fredoka text-2xl font-bold text-slate-900">
              Adicionar Novo Aluno
            </h3>
            <p className="text-xs text-slate-500">
              Inclusão individual de aluno transferido ou novato
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Turma */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Turma
            </label>
            <select
              value={turma}
              onChange={(e) => setTurma(e.target.value as TurmaId)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="401">Turma 401 (Manhã)</option>
              <option value="402">Turma 402 (Tarde)</option>
              <option value="501">Turma 501 (Manhã)</option>
              <option value="502">Turma 502 (Tarde)</option>
            </select>
          </div>

          {/* Nome do Aluno */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Nome do Aluno
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 uppercase placeholder:normal-case"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Será normalizado automaticamente em MAIÚSCULAS, sem acentos e Ç vira C.
            </span>
          </div>

          {/* Número da Conta */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Número da Conta
            </label>
            <input
              type="text"
              required
              value={numeroConta}
              onChange={(e) => setNumeroConta(e.target.value)}
              placeholder="Ex: 40125"
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 uppercase"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              O número da conta é único para cada aluno na escola.
            </span>
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 text-xs">
            ℹ️ O aluno será cadastrado com <strong>saldo inicial de Q$ 0,00</strong>.
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-fredoka font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              SALVAR ALUNO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
