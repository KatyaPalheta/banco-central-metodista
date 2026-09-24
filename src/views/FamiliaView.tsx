import React, { useState } from 'react';
import { Search, Users, ShieldCheck, TrendingUp, AlertCircle, Heart } from 'lucide-react';
import { Student, InvestmentRecord } from '../domain/types';
import { studentRepository } from '../repositories/studentRepository';
import { investmentRepository } from '../repositories/investmentRepository';
import { formatQueimacash } from '../utils/normalization';
import { soundService } from '../services/soundService';
import { calculateRedemption } from '../services/investmentConfig';

export const FamiliaView: React.FC = () => {
  const [accountInput, setAccountInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [investments, setInvestments] = useState<InvestmentRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSearched(true);

    if (!accountInput.trim()) {
      setErrorMessage('Por favor, informe o número da conta escolar do aluno.');
      return;
    }

    setLoading(true);
    try {
      const found = await studentRepository.getByAccountNumber(accountInput);
      if (found) {
        soundService.playSuccessSound();
        setStudent(found);
        const invs = await investmentRepository.getActiveByStudent(found.id);
        setInvestments(invs);
      } else {
        setStudent(null);
        setInvestments([]);
        setErrorMessage(
          `Conta "${accountInput.trim()}" não encontrada. Verifique o número com seu filho ou com a escola.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Cabeçalho Acolhedor */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-3">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>Portal da Família</span>
        </div>
        <h1 className="font-fredoka text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
          Acompanhamento Escolar
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
          Consulte o saldo e a evolução dos investimentos do seu filho no projeto de Educação Financeira.
        </p>
      </div>

      {/* Formulário de Consulta por Número de Conta */}
      <form
        onSubmit={handleSearch}
        className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-xl shadow-sky-900/5 mb-8"
      >
        <label className="block text-slate-700 font-bold text-sm sm:text-base mb-2 text-center">
          Informe o Número da Conta Escolar:
        </label>
        <div className="relative mb-4">
          <input
            type="text"
            value={accountInput}
            onChange={(e) => setAccountInput(e.target.value)}
            placeholder="Ex: 40101"
            className="w-full text-center text-3xl sm:text-4xl font-fredoka font-bold tracking-wider py-4 px-6 rounded-2xl bg-sky-50/70 border-2 border-sky-200 focus:border-blue-500 focus:bg-white focus:outline-hidden text-slate-900 placeholder:text-slate-400 placeholder:text-2xl"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-50 text-white font-fredoka font-bold text-lg shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search className="w-5 h-5" />
          {loading ? 'Consultando...' : 'CONSULTAR CONTA DO ALUNO'}
        </button>
      </form>

      {/* Erro de busca */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Resultado da Consulta Exclusivamente Leitura */}
      {searched && student && (
        <div className="space-y-6">
          {/* Cartão de Identificação e Saldo */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-sky-100 shadow-xl shadow-sky-900/10">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-5 pb-5 border-b border-sky-100">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Aluno(a)
                </span>
                <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-slate-900">
                  {student.nome}
                </h2>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">
                  Turma {student.turma} ({student.turma.endsWith('1') ? 'Turno da Manhã' : 'Turno da Tarde'}) · Conta nº {student.numeroConta}
                </div>
              </div>

              <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Conta Regular Ativa</span>
              </div>
            </div>

            {/* Display do Saldo Confirmado */}
            <div className="bg-gradient-to-br from-emerald-50 to-sky-50 rounded-2xl p-6 border border-emerald-200/80 text-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                Saldo Atual Confirmado
              </span>
              <div className="font-fredoka text-4xl sm:text-5xl font-bold text-emerald-600 my-1">
                {formatQueimacash(student.saldo)}
              </div>
              <p className="text-[11px] text-slate-500">
                Saldo seguro garantido pelo Banco Central da Escola Metodista
              </p>
            </div>
          </div>

          {/* Seção de Investimentos Ativos */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-md">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-fredoka text-xl font-bold text-slate-900">
                  Investimentos Ativos ({investments.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Aplicações escolares que estão rendendo Queimacash
                </p>
              </div>
            </div>

            {investments.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                O aluno ainda não possui aplicações em investimentos no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {investments.map((inv) => {
                  const calc = calculateRedemption(inv);
                  return (
                    <div
                      key={inv.id}
                      className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 flex flex-wrap justify-between items-center gap-3"
                    >
                      <div>
                        <div className="font-fredoka text-base font-bold text-slate-900">
                          {inv.opcaoNome}
                        </div>
                        <div className="text-xs text-slate-500">
                          Aplicado: <strong>{formatQueimacash(inv.valorAplicado)}</strong> em{' '}
                          {new Date(inv.dataAplicacao).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Estimativa Atual
                        </span>
                        <span className="font-fredoka text-lg font-bold text-purple-700">
                          {formatQueimacash(calc.valorTotalReceber)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nota Institucional de Somente Leitura */}
          <div className="text-center text-xs text-slate-400 p-4 bg-slate-100/60 rounded-2xl">
            🔒 Área estritamente de consulta familiar. Qualquer movimentação física deve ser realizada pelo aluno no Caixa Eletrônico da escola.
          </div>
        </div>
      )}
    </div>
  );
};
