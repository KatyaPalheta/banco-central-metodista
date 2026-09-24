import React, { useState } from 'react';
import {
  Printer,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { formatQueimacash } from '../utils/normalization';

interface HomeViewProps {
  onNavigate: (path: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [mascotClicks, setMascotClicks] = useState(0);
  const [mascotBubble, setMascotBubble] = useState<string | null>(null);
  const [interactiveWallet, setInteractiveWallet] = useState<number>(0);

  const notes = [
    {
      value: 5,
      color: 'from-emerald-500 to-emerald-700',
      border: 'border-emerald-300',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-800',
      desc: 'Cédula Esmeralda',
    },
    {
      value: 10,
      color: 'from-pink-500 to-rose-600',
      border: 'border-pink-300',
      bgLight: 'bg-pink-50',
      textColor: 'text-pink-800',
      desc: 'Cédula Rosa',
    },
    {
      value: 20,
      color: 'from-amber-500 to-orange-600',
      border: 'border-amber-300',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-800',
      desc: 'Cédula Âmbar',
    },
    {
      value: 50,
      color: 'from-purple-600 to-indigo-700',
      border: 'border-purple-300',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-800',
      desc: 'Cédula Roxa',
    },
    {
      value: 100,
      color: 'from-sky-500 to-blue-700',
      border: 'border-sky-300',
      bgLight: 'bg-sky-50',
      textColor: 'text-sky-800',
      desc: 'Cédula Celeste',
    },
  ];

  const handleMascotClick = () => {
    soundService.playMascotSound();
    setMascotClicks((prev) => prev + 1);

    const greetings = [
      '🌱 Olá! Vamos cuidar do seu Queimacash hoje?',
      '🪙 Cada centavo guardado é um passo para o seu futuro!',
      '✨ O Banco Central da Escola Metodista é seu amigo!',
      '🎒 Aprender a poupar é muito divertido!',
      '⭐ Muito bem! Você é um pequeno investidor inteligente!',
    ];
    const picked = greetings[Math.floor(Math.random() * greetings.length)];
    setMascotBubble(picked);

    setTimeout(() => {
      setMascotBubble(null);
    }, 3800);
  };

  const handleNoteClick = (val: number) => {
    soundService.playNoteSound(val);
    setInteractiveWallet((prev) => prev + val);
  };

  return (
    <div className="space-y-12">
      {/* Hero Section Institucional com Mascote */}
      <section className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-2 border-sky-100 shadow-xl shadow-sky-900/5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Texto de Boas-Vindas */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Escola Municipal Metodista de Queimados</span>
            </div>

            <h1 className="font-fredoka text-3xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Banco Central <br />
              <span className="text-blue-600">da Escola Metodista</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
              O sistema bancário escolar oficial do projeto de Educação Financeira.
              Aqui nossos alunos aprendem sobre poupança, investimentos, responsabilidade
              e o valor do trabalho na prática.
            </p>

            {/* Ações Rápidas */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => onNavigate('/caixa')}
                className="py-4 px-7 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-fredoka font-bold text-lg shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Printer className="w-5 h-5" />
                ACESSAR CAIXA ELETRÔNICO
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/familia')}
                className="py-4 px-6 rounded-2xl bg-sky-100 hover:bg-sky-200 active:scale-95 text-sky-900 font-bold text-sm sm:text-base transition-all flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                Área da Família
              </button>
            </div>
          </div>

          {/* Área Interativa do Mascote Oficial */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            {/* Balão de Fala do Mascote */}
            {mascotBubble && (
              <div className="mb-3 px-4 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-fredoka font-bold text-xs sm:text-sm shadow-lg max-w-xs text-center border-2 border-white animate-bounce">
                {mascotBubble}
              </div>
            )}

            <div
              onClick={handleMascotClick}
              title="Clique no Mascote para ouvir seu canto!"
              className="relative cursor-pointer group select-none"
            >
              <div className="w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-sky-300 via-blue-400 to-indigo-400 p-2 shadow-2xl group-hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center">
                <img
                  src="/mascote.png"
                  alt="Mascote do Banco Central da Escola Metodista"
                  className="w-full h-full object-contain drop-shadow-xl animate-float"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/mascote.jpg';
                  }}
                />
              </div>

              {/* Tag interativa */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-sky-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Toque no Mascote!</span>
              </div>
            </div>

            {mascotClicks > 0 && (
              <div className="mt-4 text-xs font-semibold text-slate-500">
                Toques alegres: <strong className="text-blue-600">{mascotClicks}</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* As 5 Cédulas Oficiais do Queimacash */}
      <section className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <span>🪙</span> Cédulas Oficiais
            </div>
            <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-slate-900">
              Cédulas do Queimacash
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Moeda pedagógica oficial do projeto de Educação Financeira.
            </p>
          </div>

          {interactiveWallet > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 flex items-center gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                  Simulador Lúdico
                </span>
                <span className="font-fredoka text-xl font-bold text-emerald-700">
                  {formatQueimacash(interactiveWallet)}
                </span>
              </div>
              <button
                onClick={() => setInteractiveWallet(0)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold underline cursor-pointer"
              >
                Zerar
              </button>
            </div>
          )}
        </div>

        {/* Grid das 5 Cédulas em Retângulos Limpos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
         {notes.map((note) => (
  <button
    key={note.value}
    type="button"
    onClick={() => handleNoteClick(note.value)}
    title={`Cédula Q$ ${note.value} Queimacash`}
    className={`relative overflow-hidden rounded-2xl border-2 ${note.border} bg-white hover:scale-102 active:scale-98 transition-all shadow-xs group cursor-pointer aspect-[16/10] p-0 flex items-center justify-center`}
  >
    <img
      src={`/cedula-${note.value}.png`}
      alt={`Cédula Q$ ${note.value}`}
      className="w-full h-full object-contain"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
      }}
    />
  </button>
))}
        </div>
      </section>

      {/* Rodapé Pedagógico Institucional */}
      <footer className="text-center py-6 text-xs text-slate-500 border-t border-slate-200 space-y-1">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Banco Central da Escola Metodista</span>
        </div>
        <p>Escola Municipal Metodista de Queimados · Projeto Educação Financeira 2026</p>
        <p className="text-[11px] text-slate-400">
          Todas as marcas e o nome oficial são de propriedade do projeto pedagógico institucional.
        </p>
      </footer>
    </div>
  );
};
