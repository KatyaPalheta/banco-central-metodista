import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  Sprout,
  Clock,
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  Student,
  InvestmentOptionId,
  InvestmentOptionConfig,
  InvestmentRecord,
} from '../../domain/types';
import {
  INVESTMENT_CONFIGS,
  getAvailableInvestmentOptions,
  calculateRedemption,
} from '../../services/investmentConfig';
import { investmentRepository } from '../../repositories/investmentRepository';
import { operationRepository } from '../../repositories/operationRepository';
import { printerService } from '../../services/printerService';
import { buildReceiptBytes } from '../../services/escpos';
import { formatQueimacash, generateProtocol, formatDateTime } from '../../utils/normalization';
import { soundService } from '../../services/soundService';

interface InvestmentModalProps {
  student: Student;
  onClose: () => void;
  onSuccessApplication: () => void;
  onSuccessRedemption: (protocolo: string) => void;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  student,
  onClose,
  onSuccessApplication,
  onSuccessRedemption,
}) => {
  const [activeTab, setActiveTab] = useState<'apply' | 'myInvestments'>('apply');
  const [myInvestments, setMyInvestments] = useState<InvestmentRecord[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState<boolean>(true);

  // Estados do Fluxo de Aplicação
  const [selectedOption, setSelectedOption] = useState<InvestmentOptionConfig>(
    INVESTMENT_CONFIGS.OPCAO_1
  );
  const [applyAmount, setApplyAmount] = useState<number>(0);
  const [applyStep, setApplyStep] = useState<
    'select' | 'confirm' | 'printing' | 'success' | 'error'
  >('select');

  // Estados do Fluxo de Resgate
  const [selectedForRedemption, setSelectedForRedemption] = useState<InvestmentRecord | null>(null);
  const [redeemStep, setRedeemStep] = useState<
    'list' | 'details' | 'printing' | 'success' | 'error'
  >('list');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastProtocol, setLastProtocol] = useState<string>('');

  const options = getAvailableInvestmentOptions();

  // Carrega investimentos do aluno
  const loadInvestments = async () => {
    setLoadingInvestments(true);
    try {
      const records = await investmentRepository.getActiveByStudent(student.id);
      setMyInvestments(records);
    } finally {
      setLoadingInvestments(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, [student.id]);

  // ==========================================
  // FLUXO DE APLICAÇÃO
  // ==========================================
  const handleApplyConfirm = () => {
    if (applyAmount <= 0) {
      setErrorMessage('Informe um valor maior que zero para aplicar.');
      return;
    }
    if (applyAmount > student.saldo) {
      setErrorMessage(`Saldo insuficiente. Você tem ${formatQueimacash(student.saldo)} disponível.`);
      return;
    }
    setErrorMessage(null);
    setApplyStep('confirm');
  };

  const handleExecuteApplication = async () => {
    setApplyStep('printing');
    setErrorMessage(null);

    const protocolo = generateProtocol('INV');
    setLastProtocol(protocolo);
    const dataHoraStr = formatDateTime();

    try {
      // 1. Constrói comprovante impresso
      const receiptBytes = buildReceiptBytes({
        tipo: 'INVESTIMENTO_APLICACAO',
        protocolo,
        dataHora: dataHoraStr,
        nomeAluno: student.nome,
        turma: student.turma,
        numeroConta: student.numeroConta,
        valor: applyAmount,
        detalhes: {
          opcaoInvestimento: selectedOption.nome,
        },
      });

      // 2. Envia comprovante à impressora térmica
      await printerService.printBytes(receiptBytes);

      // 3. Efetiva aplicação imediatamente (reduz saldo e registra)
      await investmentRepository.applyInvestment(student.id, selectedOption.id, applyAmount);

      soundService.playSuccessSound();
      setApplyStep('success');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || 'Falha ao imprimir na impressora térmica. A aplicação foi cancelada.'
      );
      setApplyStep('error');
    }
  };

  // ==========================================
  // FLUXO DE RESGATE
  // ==========================================
  const handleSelectRedeem = (record: InvestmentRecord) => {
    setSelectedForRedemption(record);
    setRedeemStep('details');
    setErrorMessage(null);
  };

  const handleExecuteRedemption = async () => {
    if (!selectedForRedemption) return;
    const calc = calculateRedemption(selectedForRedemption);

    if (!calc.podeResgatar) {
      setErrorMessage(calc.motivoBloqueio || 'Resgate indisponível no momento.');
      return;
    }

    setRedeemStep('printing');
    setErrorMessage(null);

    const protocolo = generateProtocol('RES');
    setLastProtocol(protocolo);
    const dataHoraStr = formatDateTime();

    try {
      // 1. Monta comprovante ESC/POS com destaque de OPERACAO PENDENTE
      const receiptBytes = buildReceiptBytes({
        tipo: 'INVESTIMENTO_RESGATE',
        protocolo,
        dataHora: dataHoraStr,
        nomeAluno: student.nome,
        turma: student.turma,
        numeroConta: student.numeroConta,
        valor: selectedForRedemption.valorAplicado,
        detalhes: {
          opcaoInvestimento: selectedForRedemption.opcaoNome,
          rendimentoBruto: calc.rendimentoBruto,
          penalidade: calc.penalidade,
          valorLiquido: calc.valorTotalReceber,
        },
      });

      // 2. Envia para a impressora
      await printerService.printBytes(receiptBytes);

      // 3. Registra operação de RESGATE PENDENTE no sistema e marca investimento
      await operationRepository.createPendingOperation({
        protocolo,
        alunoId: student.id,
        alunoNome: student.nome,
        turma: student.turma,
        numeroConta: student.numeroConta,
        tipo: 'RESGATE_INVESTIMENTO',
        valor: selectedForRedemption.valorAplicado,
        detalhes: {
          investimentoId: selectedForRedemption.id,
          opcaoTitulo: selectedForRedemption.opcaoNome,
          rendimento: calc.rendimentoLiquido,
          penalidade: calc.penalidade,
          valorLiquido: calc.valorTotalReceber,
        },
      });

      await investmentRepository.markRedemptionPending(
        selectedForRedemption.id,
        protocolo,
        calc.valorTotalReceber,
        calc.penalidade
      );

      soundService.playSuccessSound();
      setRedeemStep('success');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || 'Falha ao imprimir comprovante térmico de resgate. Operação não registrada.'
      );
      setRedeemStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-sky-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-slate-900">
              Investimentos Escolares
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Aprenda a fazer seu Queimacash crescer com inteligência
            </p>
          </div>
        </div>

        {/* Abas: Nova Aplicação / Meus Investimentos */}
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('apply');
              setApplyStep('select');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'apply'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌱 Nova Aplicação
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('myInvestments');
              setRedeemStep('list');
              loadInvestments();
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'myInvestments'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Meus Investimentos Ativos ({myInvestments.length})
          </button>
        </div>

        {/* ======================================================== */}
        {/* ABA: NOVA APLICAÇÃO */}
        {/* ======================================================== */}
        {activeTab === 'apply' && (
          <div>
            {applyStep === 'select' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Selecione uma das 3 modalidades:
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Saldo: {formatQueimacash(student.saldo)}
                  </span>
                </div>

                {/* As 3 opções conceituais */}
                <div className="space-y-3 mb-6">
                  {options.map((opt) => {
                    const isSelected = selectedOption.id === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setSelectedOption(opt);
                          soundService.playNoteSound(20);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50/50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                                opt.id === 'OPCAO_1'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : opt.id === 'OPCAO_2'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {opt.id === 'OPCAO_1' && <Sprout className="w-5 h-5" />}
                              {opt.id === 'OPCAO_2' && <Clock className="w-5 h-5" />}
                              {opt.id === 'OPCAO_3' && <TrendingUp className="w-5 h-5" />}
                            </div>

                            <div>
                              <div className="font-fredoka text-lg font-bold text-slate-900">
                                {opt.nome}
                              </div>
                              <div className="text-xs text-slate-600 leading-relaxed">
                                {opt.descricaoCurta}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                              +{opt.rendimentoTaxaPercentual}%
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-purple-900 leading-relaxed bg-white/70 p-3 rounded-xl">
                            <strong>Como funciona:</strong> {opt.detalhesRegra}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Campo de valor para aplicar */}
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                    Quanto Queimacash você deseja aplicar?
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[5, 10, 20, 50].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          soundService.playNoteSound(v);
                          setApplyAmount(v);
                        }}
                        className={`py-2 px-1 rounded-xl font-fredoka font-bold text-sm border transition-all cursor-pointer ${
                          applyAmount === v
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50'
                        }`}
                      >
                        Q$ {v}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={student.saldo}
                      value={applyAmount || ''}
                      onChange={(e) => setApplyAmount(Number(e.target.value))}
                      placeholder="Outro valor..."
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-300 font-bold text-slate-900 text-lg focus:outline-hidden focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setApplyAmount(student.saldo)}
                      className="py-3 px-3 rounded-xl bg-purple-100 text-purple-800 text-xs font-bold hover:bg-purple-200 transition-colors"
                    >
                      Aplicar Todo Saldo
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleApplyConfirm}
                  disabled={applyAmount <= 0 || applyAmount > student.saldo}
                  className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-98 disabled:opacity-50 text-white font-fredoka font-bold text-lg shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  REVISAR E CONFIRMAR APLICAÇÃO
                </button>
              </div>
            )}

            {/* Confirmação de Aplicação */}
            {applyStep === 'confirm' && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-4">
                  <Printer className="w-8 h-8" />
                </div>

                <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
                  Confirmar Aplicação?
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Seu Queimacash começará a render imediatamente após a impressão do comprovante.
                </p>

                <div className="bg-sky-50 rounded-2xl p-5 mb-6 text-left space-y-2 border border-sky-100 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Modalidade:</span>
                    <span className="font-bold text-purple-800">{selectedOption.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valor Aplicado:</span>
                    <span className="font-fredoka text-lg font-bold text-slate-900">
                      {formatQueimacash(applyAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Taxa de Rendimento:</span>
                    <span className="font-bold text-emerald-700">+{selectedOption.rendimentoTaxaPercentual}%</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
                  ✅ <strong>Aplicação Automática:</strong> Não necessita de aprovação do professor.
                  O valor sairá do seu saldo disponível e começará a render!
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyStep('select')}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteApplication}
                    className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-fredoka font-bold text-base shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    APLICAR E IMPRIMIR
                  </button>
                </div>
              </div>
            )}

            {/* Imprimindo Aplicação */}
            {applyStep === 'printing' && (
              <div className="text-center py-8">
                <RefreshCw className="w-14 h-14 text-purple-600 animate-spin mx-auto mb-4" />
                <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
                  Imprimindo Comprovante de Investimento...
                </h3>
                <p className="text-slate-600 text-sm">
                  Emitindo comprovante de aplicação física na impressora térmica Bluetooth.
                </p>
              </div>
            )}

            {/* Sucesso Aplicação */}
            {applyStep === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
                  Aplicação Concluída com Sucesso!
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Guarde seu comprovante. Seu investimento já está ativo!
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-xs text-slate-600 font-mono">
                  Protocolo: <strong className="text-slate-800">{lastProtocol}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => onSuccessApplication()}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-fredoka font-bold text-base shadow-md cursor-pointer"
                >
                  VOLTAR AO PAINEL
                </button>
              </div>
            )}

            {/* Falha na Aplicação */}
            {applyStep === 'error' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
                  Falha na Impressão
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Como o comprovante não foi emitido, a aplicação não foi concluída e seu saldo permanece intacto.
                </p>
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs mb-6 text-left">
                  {errorMessage}
                </div>
                <button
                  type="button"
                  onClick={() => setApplyStep('select')}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA: MEUS INVESTIMENTOS (RESGATE) */}
        {/* ======================================================== */}
        {activeTab === 'myInvestments' && (
          <div>
            {redeemStep === 'list' && (
              <div>
                {loadingInvestments ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    Carregando seus investimentos...
                  </div>
                ) : myInvestments.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <p className="font-fredoka text-lg text-slate-700 mb-1">
                      Você ainda não possui investimentos ativos.
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      Que tal aplicar uma parte do seu Queimacash para começar?
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('apply')}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
                    >
                      Ver Opções de Aplicação
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase text-slate-500 mb-2">
                      Toque em um investimento para ver detalhes ou solicitar resgate:
                    </div>
                    {myInvestments.map((inv) => {
                      const calc = calculateRedemption(inv);
                      return (
                        <div
                          key={inv.id}
                          onClick={() => handleSelectRedeem(inv)}
                          className="p-4 rounded-2xl border border-slate-200 hover:border-purple-400 bg-white hover:bg-purple-50/20 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                        >
                          <div>
                            <div className="font-fredoka text-base font-bold text-slate-900">
                              {inv.opcaoNome}
                            </div>
                            <div className="text-xs text-slate-500">
                              Aplicado: <strong>{formatQueimacash(inv.valorAplicado)}</strong> em{' '}
                              {new Date(inv.dataAplicacao).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs font-semibold text-emerald-700 mt-1">
                              Estimado para resgate: {formatQueimacash(calc.valorTotalReceber)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {calc.podeResgatar ? (
                              <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 text-xs font-bold flex items-center gap-1">
                                Resgatar <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" /> Bloqueado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Detalhes do Resgate */}
            {redeemStep === 'details' && selectedForRedemption && (
              <div>
                {(() => {
                  const calc = calculateRedemption(selectedForRedemption);
                  return (
                    <div>
                      <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-1">
                        Solicitação de Resgate
                      </h3>
                      <p className="text-xs text-slate-600 mb-5">
                        Confira o cálculo pedagógico do seu resgate:
                      </p>

                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Modalidade:</span>
                          <span className="font-bold text-slate-800">{selectedForRedemption.opcaoNome}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Valor Inicial Aplicado:</span>
                          <span className="font-bold text-slate-800">
                            {formatQueimacash(selectedForRedemption.valorAplicado)}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-700">
                          <span>Rendimento Bruto:</span>
                          <span className="font-bold">+ {formatQueimacash(calc.rendimentoBruto)}</span>
                        </div>

                        {calc.penalidade > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>Penalidade por Resgate Antecipado:</span>
                            <span className="font-bold">- {formatQueimacash(calc.penalidade)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
                          <span className="text-slate-900">Total a Receber:</span>
                          <span className="font-fredoka text-xl text-purple-700">
                            {formatQueimacash(calc.valorTotalReceber)}
                          </span>
                        </div>
                      </div>

                      {!calc.podeResgatar ? (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-6 flex items-start gap-2">
                          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div>{calc.motivoBloqueio}</div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-6">
                          ⚠️ O valor do resgate ficará <strong>PENDENTE</strong> até o professor confirmar a entrega do comprovante impresso.
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRedeemStep('list')}
                          className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                        >
                          Voltar
                        </button>

                        <button
                          type="button"
                          disabled={!calc.podeResgatar}
                          onClick={handleExecuteRedemption}
                          className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-fredoka font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          CONFIRMAR E IMPRIMIR
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Imprimindo Resgate */}
            {redeemStep === 'printing' && (
              <div className="text-center py-8">
                <RefreshCw className="w-14 h-14 text-purple-600 animate-spin mx-auto mb-4" />
                <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
                  Imprimindo Comprovante de Resgate...
                </h3>
                <p className="text-slate-600 text-sm">
                  Transmitindo bytes ESC/POS para a impressora Bluetooth.
                </p>
              </div>
            )}

            {/* Sucesso Resgate */}
            {redeemStep === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
                  Comprovante Impresso com Sucesso!
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Apresente o comprovante de resgate ao seu professor para creditar o valor na sua conta.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-xs text-slate-600 font-mono">
                  Protocolo: <strong className="text-slate-800">{lastProtocol}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => onSuccessRedemption(lastProtocol)}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-fredoka font-bold text-base shadow-md cursor-pointer"
                >
                  CONCLUIR OPERAÇÃO
                </button>
              </div>
            )}

            {/* Falha no Resgate */}
            {redeemStep === 'error' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="font-fredoka text-2xl font-bold text-slate-900 mb-2">
                  Falha na Impressão
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  O resgate não foi solicitado porque o comprovante físico falhou.
                </p>
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs mb-6 text-left">
                  {errorMessage}
                </div>
                <button
                  type="button"
                  onClick={() => setRedeemStep('list')}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
