import React from 'react';
import { X, Printer } from 'lucide-react';
import { ReceiptData } from '../../services/escpos';
import { formatQueimacash } from '../../utils/normalization';

interface ReceiptPreviewModalProps {
  data: ReceiptData;
  onClose: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  data,
  onClose,
}) => {
  const titles: Record<ReceiptData['tipo'], string> = {
    DEPOSITO: 'COMPROVANTE DE DEPÓSITO',
    SAQUE: 'COMPROVANTE DE SAQUE',
    INVESTIMENTO_APLICACAO: 'APLICAÇÃO EM INVESTIMENTO',
    INVESTIMENTO_RESGATE: 'RESGATE DE INVESTIMENTO',
  };

  const pending =
    data.tipo === 'DEPOSITO' ||
    data.tipo === 'SAQUE' ||
    data.tipo === 'INVESTIMENTO_RESGATE';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="relative max-h-[92vh] overflow-y-auto">
        <div className="mb-3 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400 text-amber-950 font-bold text-xs shadow-lg">
            🧪 SIMULAÇÃO — NENHUM PAPEL FOI IMPRESSO
          </span>
        </div>

        <div className="w-[300px] max-w-[90vw] bg-[#fffdf7] text-slate-900 shadow-2xl px-5 py-6 font-mono text-[11px] leading-relaxed">
          <div className="text-center">
            <Printer className="w-7 h-7 mx-auto mb-2" />

            <div className="font-bold text-base">
              BANCO CENTRAL
            </div>

            <div className="font-bold text-base">
              DA ESCOLA METODISTA
            </div>

            <div className="mt-1">
              PROJETO EDUCAÇÃO FINANCEIRA
            </div>

            <div className="my-3 border-t-2 border-dashed border-slate-400" />

            <div className="font-bold">
              {titles[data.tipo]}
            </div>

            <div className="my-3 border-t border-dashed border-slate-400" />
          </div>

          <div className="space-y-1">
            <div><strong>PROTOCOLO:</strong> {data.protocolo}</div>
            <div><strong>DATA/HORA:</strong> {data.dataHora}</div>

            <div className="my-2 border-t border-dotted border-slate-400" />

            <div><strong>ALUNO:</strong> {data.nomeAluno}</div>
            <div><strong>TURMA:</strong> {data.turma}</div>
            <div><strong>CONTA:</strong> {data.numeroConta}</div>

            <div className="my-2 border-t border-dotted border-slate-400" />

            <div className="text-sm font-bold">
              VALOR: {formatQueimacash(data.valor)}
            </div>

            {data.detalhes?.opcaoInvestimento && (
              <div>
                <strong>MODALIDADE:</strong>{' '}
                {data.detalhes.opcaoInvestimento}
              </div>
            )}
            {data.detalhes?.prazoDias !== undefined && (
  <div>
    <strong>PRAZO:</strong>{' '}
    {data.detalhes.prazoDias}{' '}
    {data.detalhes.prazoDias === 1 ? 'dia' : 'dias'}
  </div>
)}

{data.detalhes?.dataVencimento && (
  <div>
    <strong>VENCIMENTO:</strong>{' '}
    {data.detalhes.dataVencimento}
  </div>
)}

            {!!data.detalhes?.penalidade && (
              <div>
                <strong>PENALIDADE:</strong>{' '}
                - {formatQueimacash(data.detalhes.penalidade)}
              </div>
            )}

            {data.detalhes?.valorLiquido !== undefined && (
              <div className="font-bold">
                A RECEBER:{' '}
                {formatQueimacash(data.detalhes.valorLiquido)}
              </div>
            )}
          </div>

          <div className="my-3 border-t-2 border-dashed border-slate-400" />

          <div className="text-center">
            {pending ? (
              <>
                <div className="font-bold">
                  *** OPERAÇÃO PENDENTE ***
                </div>
                <div className="mt-2">
                  APRESENTE ESTE COMPROVANTE
                </div>
                <div>AO PROFESSOR</div>

                <div className="mt-2">
                  O saldo só será atualizado
                  <br />
                  após confirmação escolar.
                </div>
              </>
            ) : (
              <>
                <div className="font-bold">
                  APLICAÇÃO EFETIVADA
                </div>
                <div className="mt-2">
                  Seu Queimacash já está rendendo!
                </div>
              </>
            )}

            <div className="my-3 border-t border-dashed border-slate-400" />

            <div>ESCOLA METODISTA DE QUEIMADOS</div>
            <div>Cuidando do seu futuro</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-fredoka font-bold shadow-lg cursor-pointer"
        >
          FECHAR COMPROVANTE
        </button>

        <button
          type="button"
          onClick={onClose}
          className="absolute -top-1 -right-2 w-9 h-9 rounded-full bg-white text-slate-700 shadow-md flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};