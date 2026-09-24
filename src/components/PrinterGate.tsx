import React, { useState } from 'react';
import { Printer, Bluetooth, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { printerService, PrinterState } from '../services/printerService';
import { soundService } from '../services/soundService';

interface PrinterGateProps {
  printerState: PrinterState;
  onConnected?: () => void;
  children: React.ReactNode;
}

export const PrinterGate: React.FC<PrinterGateProps> = ({
  printerState,
  children,
}) => {
  const [connecting, setConnecting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLocalError(null);
    setConnecting(true);
    try {
      await printerService.requestAndConnect();
      soundService.playSuccessSound();
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== 'NotFoundError') {
        setLocalError(error.message || 'Falha ao conectar impressora Bluetooth.');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleReconnect = async () => {
    setLocalError(null);
    setConnecting(true);
    try {
      const ok = await printerService.tryAutoReconnect();
      if (ok) {
        soundService.playSuccessSound();
      } else {
        setLocalError('Nenhum dispositivo previamente autorizado foi encontrado. Clique em "Conectar Impressora".');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setLocalError(error.message || 'Erro ao reconectar.');
    } finally {
      setConnecting(false);
    }
  };

  // Se a impressora está conectada e funcional, exibe a interface do Caixa normalmente
  if (printerState.status === 'connected') {
    return <>{children}</>;
  }

  // Se a impressora NÃO está conectada, BLOQUEIA TOTALMENTE a utilização do Caixa
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-2 border-amber-200 shadow-xl shadow-sky-900/10 text-center">
        {/* Ícone de bloqueio de impressora */}
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto shadow-inner text-amber-700 animate-pulse">
            <Printer className="w-12 h-12 sm:w-14 sm:h-14" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white p-2 rounded-full shadow-md">
            <Bluetooth className="w-5 h-5 animate-bounce" />
          </div>
        </div>

        <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Impressora Térmica Necessária
        </h2>

        <p className="text-slate-600 text-sm sm:text-base mb-6 leading-relaxed">
          Para a segurança dos alunos e emissão obrigatória dos comprovantes físicos,
          o <strong className="text-slate-800">Caixa Eletrônico da Escola Metodista</strong> só
          funciona com a mini impressora térmica conectada via Bluetooth.
        </p>

        {/* Mensagens de erro ou avisos de compatibilidade */}
        {!printerState.isBluetoothSupported && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm text-left flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong>Web Bluetooth não detectado:</strong>
              <p className="mt-1">
                Certifique-se de estar utilizando o <strong>Google Chrome</strong> no tablet Android da
                escola com o Bluetooth ligado.
              </p>
            </div>
          </div>
        )}

        {(localError || printerState.errorMessage) && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm text-left flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>{localError || printerState.errorMessage}</div>
          </div>
        )}

        {/* Botão de conexão principal */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-fredoka font-bold text-lg sm:text-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
          >
            {connecting ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Localizando impressora...
              </>
            ) : (
              <>
                <Bluetooth className="w-6 h-6" />
                CONECTAR IMPRESSORA
              </>
            )}
          </button>

          <button
            onClick={handleReconnect}
            disabled={connecting}
            className="w-full py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} />
            Tentar Reconectar Dispositivo Conhecido
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Mini Impressora Térmica Baihuo / POS-58 (Papel 58mm)</span>
        </div>
      </div>
    </div>
  );
};
