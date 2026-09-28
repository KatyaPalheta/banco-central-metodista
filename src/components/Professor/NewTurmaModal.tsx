import React, { useState } from 'react';
import { X, School, Plus } from 'lucide-react';
import { turmaRepository } from '../../repositories/turmaRepository';

interface NewTurmaModalProps {
  onClose: () => void;
  onSuccess: (codigo: string) => void;
}

export const NewTurmaModal: React.FC<NewTurmaModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage(null);

    try {
      const turma = await turmaRepository.create(codigo);

      onSuccess(turma.codigo);
    } catch (error) {
      const err = error as Error;

      setErrorMessage(
        err.message || 'Não foi possível criar a turma.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodigoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const somenteNumeros = e.target.value
      .replace(/\D/g, '')
      .slice(0, 3);

    setCodigo(somenteNumeros);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-sky-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <School className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-fredoka text-2xl font-bold text-slate-900">
              Nova Turma
            </h3>

            <p className="text-xs text-slate-500">
              Cadastre uma nova turma para gerenciamento de alunos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-xs font-bold text-slate-700">
            Código da turma
          </label>

          <input
            type="text"
            inputMode="numeric"
            value={codigo}
            onChange={handleCodigoChange}
            placeholder="Ex: 406"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-lg font-bold text-center tracking-wider focus:outline-hidden focus:border-blue-500"
          />

          <p className="mt-2 text-xs text-slate-500">
            Informe exatamente 3 números.
          </p>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {errorMessage}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || codigo.length !== 3}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-fredoka font-bold text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />

              {loading ? 'Criando...' : 'CRIAR TURMA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};