import React, { useState } from 'react';

import {
  Search,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Heart,
  History,
  WalletCards,
} from 'lucide-react';

import {
  familyRepository,
  FamilyAccount,
} from '../repositories/familyRepository';

import { formatQueimacash } from '../utils/normalization';
import { soundService } from '../services/soundService';

export const FamiliaView: React.FC = () => {
  const [accountInput, setAccountInput] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [account, setAccount] =
    useState<FamilyAccount | null>(null);

  const [searched, setSearched] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const handleSearch = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMessage(null);
    setSearched(true);

    if (!accountInput.trim()) {
      setErrorMessage(
        'Por favor, informe o número da conta escolar do aluno.'
      );

      return;
    }

    setLoading(true);

    try {
      const found =
        await familyRepository.getByAccountNumber(
          accountInput
        );

      if (!found) {
        setAccount(null);

        setErrorMessage(
          `Conta "${accountInput.trim()}" não encontrada. Verifique o número com seu filho ou com a escola.`
        );

        return;
      }

      soundService.playSuccessSound();
      setAccount(found);
    } catch (error) {
      console.error(error);

      setAccount(null);

      setErrorMessage(
        'Não foi possível consultar a conta neste momento.'
      );
    } finally {
      setLoading(false);
    }
  };

  const student =
    account?.student ?? null;

  const investments =
    account?.investments ?? [];

  const history =
    account?.history ?? [];

  const valorInvestido =
    investments.reduce(
      (total, investment) =>
        total +
        Number(investment.valorAtual),
      0
    );

  const totalGeral = student
    ? Number(
        (
          Number(student.saldo) +
          valorInvestido
        ).toFixed(2)
      )
    : 0;

  const formatHistoryValue = (
    value: number
  ) => {
    if (value > 0) {
      return `+${formatQueimacash(value)}`;
    }

    return formatQueimacash(value);
  };

  return (
    <div className="max-w-2xl mx-auto py-2">

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-3">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />

          <span>
            Portal da Família
          </span>
        </div>

        <h1 className="font-fredoka text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
          Acompanhamento Escolar
        </h1>

        <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto">
          Consulte o saldo, os investimentos e a movimentação escolar do aluno.
        </p>
      </div>

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
            onChange={(e) =>
              setAccountInput(
                e.target.value
              )
            }
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

          {loading
            ? 'Consultando...'
            : 'CONSULTAR CONTA DO ALUNO'}
        </button>
      </form>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />

          <span>
            {errorMessage}
          </span>
        </div>
      )}

      {searched && student && (
        <div className="space-y-6">

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
                  Turma {student.turma}
                  {' · '}
                  Conta nº {student.numeroConta}
                </div>
              </div>

              <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />

                <span>
                  Conta Regular Ativa
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-sky-50 rounded-2xl p-6 border border-emerald-200/80 text-center mb-3">

              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                Saldo disponível
              </span>

              <div className="font-fredoka text-4xl sm:text-5xl font-bold text-emerald-600 my-1">
                {formatQueimacash(
                  Number(student.saldo)
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                Valor disponível para movimentações
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 text-center">

                <TrendingUp className="w-5 h-5 mx-auto text-purple-600 mb-1" />

                <span className="text-[10px] uppercase font-bold text-purple-700">
                  Em investimentos
                </span>

                <div className="font-fredoka text-xl font-bold text-purple-700 mt-1">
                  {formatQueimacash(
                    valorInvestido
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-center">

                <WalletCards className="w-5 h-5 mx-auto text-sky-600 mb-1" />

                <span className="text-[10px] uppercase font-bold text-sky-700">
                  Total que possui
                </span>

                <div className="font-fredoka text-xl font-bold text-sky-700 mt-1">
                  {formatQueimacash(
                    totalGeral
                  )}
                </div>
              </div>

            </div>
          </div>

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
                  Aplicações escolares em andamento
                </p>
              </div>
            </div>

            {investments.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                O aluno não possui investimentos ativos no momento.
              </div>
            ) : (
              <div className="space-y-3">

                {investments.map(
                  (investment) => (
                    <div
                      key={investment.id}
                      className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 flex flex-wrap justify-between items-center gap-3"
                    >
                      <div>
                        <div className="font-fredoka text-base font-bold text-slate-900">
                          {investment.opcaoNome}
                        </div>

                        <div className="text-xs text-slate-500">
                          Aplicado:{' '}
                          <strong>
                            {formatQueimacash(
                              Number(
                                investment.valorAplicado
                              )
                            )}
                          </strong>
                          {' em '}
                          {new Date(
                            investment.dataAplicacao
                          ).toLocaleDateString(
                            'pt-BR'
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Valor atual
                        </span>

                        <span className="font-fredoka text-lg font-bold text-purple-700">
                          {formatQueimacash(
                            Number(
                              investment.valorAtual
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-md">

            <div className="flex items-center gap-2.5 mb-4">

              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>

              <div>
                <h3 className="font-fredoka text-xl font-bold text-slate-900">
                  Histórico da Conta
                </h3>

                <p className="text-xs text-slate-500">
                  Últimas movimentações registradas
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                Ainda não existem movimentações nesta conta.
              </div>
            ) : (
              <div className="space-y-2">

                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex justify-between gap-4 mb-2">

                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {item.descricao}
                        </div>

                        <div className="text-[11px] text-slate-400">
                          {new Date(
                            item.dataHora
                          ).toLocaleString(
                            'pt-BR'
                          )}
                        </div>
                      </div>

                      <div
                        className={`font-fredoka font-bold ${
                          Number(
                            item.valor
                          ) < 0
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {formatHistoryValue(
                          Number(item.valor)
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">

                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">
                          Disponível
                        </span>

                        <span className="text-xs font-bold text-slate-700">
                          {formatQueimacash(
                            Number(
                              item.saldoDisponivel
                            )
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">
                          Investido
                        </span>

                        <span className="text-xs font-bold text-purple-700">
                          {formatQueimacash(
                            Number(
                              item.valorInvestido
                            )
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">
                          Total
                        </span>

                        <span className="text-xs font-bold text-sky-700">
                          {formatQueimacash(
                            Number(
                              item.total
                            )
                          )}
                        </span>
                      </div>

                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-400 p-4 bg-slate-100/60 rounded-2xl">
            🔒 Área exclusivamente de consulta familiar. Movimentações devem ser realizadas pelo aluno no Caixa Eletrônico da escola.
          </div>

        </div>
      )}
    </div>
  );
};