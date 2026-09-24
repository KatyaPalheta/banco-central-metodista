import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Printer, CheckCircle2, AlertTriangle, RefreshCw, Maximize, Minimize } from 'lucide-react';
import { printerService, PrinterState } from '../services/printerService';
import { soundService } from '../services/soundService';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [printerState, setPrinterState] = useState<PrinterState>(printerService.getState());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.isSoundEnabled());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const unsub = printerService.subscribe((state) => {
      setPrinterState(state);
    });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      unsub();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Tela cheia indisponível ou bloqueada pelo navegador', err);
    }
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    soundService.setSoundEnabled(newVal);
    setSoundEnabled(newVal);
    if (newVal) {
      soundService.playMascotSound();
    }
  };

  const getPrinterBadge = () => {
    if (printerState.status === 'connected') {
      return (
        <span
          title={`Impressora conectada: ${printerState.deviceName || 'POS-58'}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Impressora:</span> Conectada
        </span>
      );
    }
    if (printerState.status === 'connecting') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
          Conectando...
        </span>
      );
    }
    return (
      <span
        title="Impressora térmica desconectada. Necessária para o Caixa."
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span className="hidden sm:inline">Impressora:</span> Desconectada
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs transition-all">
      {/* Faixa Institucional Oficial do Município e Escola */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-sky-700 text-white text-[11px] font-extrabold uppercase tracking-widest px-4 py-1.5 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-2">
          <span>Escola Municipal Metodista de Queimados</span>
          <span className="hidden sm:inline text-sky-200 font-normal">|</span>
          <span className="hidden sm:inline text-sky-100 font-bold normal-case text-[10px] tracking-normal">
            Projeto Educação Financeira 2026
          </span>
        </div>
        <div className="text-[10px] text-sky-100 font-semibold lowercase tracking-normal">
          bancometodista.com.br
        </div>
      </div>

      {/* Barra Principal de Navegação */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Identidade / Brasão Oficial */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left group focus:outline-hidden"
        >
          <img
            src="/brasao-queimados.png"
            alt="Brasão Escola Metodista"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain shrink-0 group-hover:scale-105 transition-transform"
            onError={(e) => {
              // Fallback se imagem não carregar
              (e.currentTarget as HTMLImageElement).src = '/brasao-queimados.jpg';
            }}
          />
          <div>
            <div className="font-fredoka text-lg sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Banco Central <span className="text-blue-600">da Escola Metodista</span>
            </div>
            <div className="text-xs font-bold text-emerald-700 hidden sm:block">
              Educação Financeira Infantil e Cidadania
            </div>
          </div>
        </button>

        {/* Links de navegação entre áreas */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onNavigate('/')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              currentPath === '/'
                ? 'bg-blue-100/80 text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Início
          </button>

          <button
            onClick={() => onNavigate('/caixa')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-fredoka font-semibold transition-all flex items-center gap-1.5 ${
              currentPath === '/caixa'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            Caixa Eletrônico
          </button>

          <button
            onClick={() => onNavigate('/familia')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              currentPath === '/familia'
                ? 'bg-sky-100 text-sky-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Família
          </button>

          <button
            onClick={() => onNavigate('/professor')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              currentPath === '/professor'
                ? 'bg-amber-100 text-amber-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            Professor
          </button>
        </nav>

        {/* Controles: Impressora, Tela Cheia e Som */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden md:flex">{getPrinterBadge()}</div>

          {/* Botão de Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Modo tela cheia'}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia para tablet ou computador'}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer flex items-center gap-1"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-blue-600" />
            ) : (
              <Maximize className="w-5 h-5 text-slate-600" />
            )}
            <span className="hidden lg:inline text-xs font-bold text-slate-600">
              {isFullscreen ? 'Reduzir' : 'Tela Cheia'}
            </span>
          </button>

          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Desativar sons' : 'Ativar sons'}
            title={soundEnabled ? 'Sons ativados' : 'Sons desativados'}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
