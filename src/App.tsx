import React, { useState } from 'react';
import { 
  Sparkles, 
  Heart, 
  Coins, 
  TreePine, 
  Volume2, 
  VolumeX, 
  Sun, 
  Smile
} from 'lucide-react';

interface ClickBubble {
  id: number;
  x: number;
  y: number;
  text: string;
}

export default function App() {
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bubbles, setBubbles] = useState<ClickBubble[]>([]);
  const [coinsCollected, setCoinsCollected] = useState(0);

  // Play a friendly playful chime using browser Web Audio
  const playDing = (freq = 659.25) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not supported or blocked
    }
  };

  const spawnBubble = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (Math.random() * 20 - 10);
    const y = e.clientY - rect.top - 10;
    const newBubble = { id: Date.now() + Math.random(), x, y, text };
    setBubbles((prev) => [...prev.slice(-6), newBubble]);
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, 1000);
  };

  const handleNoteClick = (val: number, e: React.MouseEvent) => {
    setActiveNote(val);
    setCoinsCollected((c) => c + val);
    playDing(520 + val * 2.8);
    spawnBubble(e, `+Q$ ${val}! 🪙`);
  };

  const handleMascotClick = (e: React.MouseEvent) => {
    setCoinsCollected((c) => c + 5);
    playDing(784); // G5
    spawnBubble(e, '🌱 Olá, amiguinho!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f4fd] via-[#f0f9ff] to-[#fcf8ee] text-slate-800 flex flex-col justify-between relative overflow-hidden select-none">
      
      {/* Playful Floating Light Elements (Sun, clouds, bubbles) */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        {/* Soft Sunny Glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-200/40 rounded-full blur-3xl" />
        <div className="absolute top-12 left-10 text-amber-400/50 animate-float">
          <Sun className="w-10 h-10" />
        </div>
        <div className="absolute top-1/4 right-8 w-16 h-8 bg-white/70 rounded-full blur-[1px] animate-float-reverse shadow-sm" />
        <div className="absolute top-1/3 left-6 w-20 h-10 bg-white/60 rounded-full blur-[1px] animate-float shadow-sm" />
        
        {/* Colorful soft sparkle dots */}
        <div className="absolute top-24 left-[20%] w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-40" />
        <div className="absolute bottom-28 left-[8%] w-3.5 h-3.5 bg-emerald-400/50 rounded-full animate-float" />
        <div className="absolute bottom-36 right-[10%] w-4 h-4 bg-sky-400/40 rounded-full animate-float-reverse" />
        <div className="absolute top-1/2 right-[4%] w-3 h-3 bg-pink-400/40 rounded-full animate-pulse" />
      </div>

      {/* Top Header - School Identification */}
      <header className="relative z-20 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-sky-200/60 bg-white/80 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2.5">
          <img
  src="/brasao-queimados.png"
  alt="Prefeitura de Queimados"
  className="w-9 h-9 object-contain"
/>
          <div>
            <p className="text-[11px] sm:text-xs uppercase tracking-wider text-emerald-800 font-extrabold">
              Escola Municipal Metodista de Queimados
            </p>
            <p className="text-[10px] text-slate-500 font-bold">
              Projeto Educação Financeira 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {coinsCollected > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-amber-800 font-['Fredoka'] font-bold text-xs sm:text-sm shadow-xs animate-bounce">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>Q$ {coinsCollected}</span>
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-full bg-sky-100/80 hover:bg-sky-200 text-slate-600 hover:text-slate-800 transition-colors border border-sky-200/70"
            title={soundEnabled ? 'Som ativado' : 'Som desativado'}
            aria-label="Controle de som"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </header>

      {/* Main Playful Single-Page View */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6 max-w-4xl mx-auto w-full text-center">
        
        {/* EM BREVE! Colorful Pill Badge */}
        <div className="mb-2 sm:mb-3">
          <span className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 text-slate-950 font-['Fredoka'] font-bold text-xs sm:text-sm shadow-md shadow-amber-400/25 tracking-wide transform hover:scale-105 transition-transform border border-amber-200">
            <Sparkles className="w-4 h-4 text-amber-900 fill-amber-900 animate-spin" style={{ animationDuration: '6s' }} />
            EM BREVE NOVO SITE!
            <Sparkles className="w-4 h-4 text-amber-900 fill-amber-900 animate-spin" style={{ animationDuration: '6s' }} />
          </span>
        </div>

        {/* Playful & Grand Title */}
        <h1 className="font-fun text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 drop-shadow-xs">
          Banco Central da <span className="text-blue-600 drop-shadow-xs">Escola Metodista</span>
        </h1>

        {/* Project Slogans */}
        <div className="mt-1 mb-2 space-y-0.5">
          <p className="text-sm sm:text-lg text-emerald-700 font-bold tracking-wide flex items-center justify-center gap-1.5">
            <span>🌱</span>
            <span>Metodizando o Dinheiro: Meu dinheiro, meu futuro</span>
          </p>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold italic">
            “Pequenos Passos, Grandes Sonhos!”
          </p>
        </div>

        {/* THE MASCOT (ÁRVOREZINHA) - HERO CENTERPIECE */}
        <div className="relative my-2 sm:my-3 flex items-center justify-center">
          {/* Gentle Sunny Halo */}
          <div className="absolute w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-tr from-amber-200/40 via-emerald-100/50 to-sky-200/40 rounded-full blur-2xl animate-glow pointer-events-none" />

          {/* Floating animated coin badges around the tree */}
          <div className="absolute z-20 -top-2 -left-2 sm:left-2 px-3 py-1.5 bg-amber-400 text-amber-950 rounded-full shadow-md font-['Fredoka'] font-bold text-xs sm:text-sm animate-float flex items-center gap-1 border border-amber-200">
            <span>🪙 Q$ 5</span>
          </div>

          <div className="absolute z-20 -bottom-1 -right-2 sm:right-2 px-3 py-1.5 bg-emerald-500 text-white rounded-full shadow-md font-['Fredoka'] font-bold text-xs sm:text-sm animate-float-reverse flex items-center gap-1 border border-emerald-300">
            <span>⭐ Queimacash!</span>
          </div>

          {/* Interactive Floating Click Bubbles */}
          {bubbles.map((b) => (
            <div
              key={b.id}
              style={{ left: b.x, top: b.y }}
              className="absolute z-30 pointer-events-none font-['Fredoka'] font-bold text-sm sm:text-base text-emerald-800 bg-white/90 px-2 py-0.5 rounded-full shadow-md border border-emerald-200 animate-bounce"
            >
              {b.text}
            </div>
          ))}

          {/* Mascot Image Card */}
          <div 
            onClick={handleMascotClick}
            className="relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 group"
            title="Clique no Raizinho!"
          >
            <div className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-3xl overflow-hidden p-2 bg-white/80 border-3 border-amber-300/80 shadow-xl shadow-sky-900/10 backdrop-blur-sm flex items-center justify-center relative">
              <img
                src="/mascote.png"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/mascote.jpg';
                }}
                alt="Arvorezinha Mascote Metodinho segurando notas de Queimacash"
                className="w-full h-full object-contain select-none"
                draggable={false}
              />
              
              {/* Cute hover helper pill */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-slate-900/75 backdrop-blur-sm rounded-full text-[11px] font-bold text-amber-200 opacity-90 border border-white/20 shadow-xs flex items-center gap-1">
                <Smile className="w-3 h-3 text-amber-300" />
                <span>Toque no Raizinho!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Play Queimacash Banknotes */}
        <div className="w-full max-w-lg mt-2 mb-2">
          <p className="text-xs uppercase tracking-wider text-slate-600 font-extrabold mb-2.5 flex items-center justify-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Conheça as notas do Queimacash:</span>
          </p>

          <div className="grid grid-cols-5 gap-2 sm:gap-2.5 px-1 sm:px-2">
            {[
              { val: 5, name: 'Verde', color: 'bg-emerald-500 hover:bg-emerald-400 border-emerald-300 text-white shadow-emerald-500/20' },
              { val: 10, name: 'Rosa', color: 'bg-pink-500 hover:bg-pink-400 border-pink-300 text-white shadow-pink-500/20' },
              { val: 20, name: 'Amarelo', color: 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-amber-950 shadow-amber-400/20' },
              { val: 50, name: 'Lilás', color: 'bg-purple-500 hover:bg-purple-400 border-purple-300 text-white shadow-purple-500/20' },
              { val: 100, name: 'Azul', color: 'bg-sky-500 hover:bg-sky-400 border-sky-300 text-white shadow-sky-500/20' },
            ].map((note) => (
              <button
                key={note.val}
                onClick={(e) => handleNoteClick(note.val, e)}
                className={`py-2 px-1 rounded-2xl border-2 font-['Fredoka'] font-bold text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-1 active:translate-y-0.5 cursor-pointer flex flex-col items-center justify-center ${note.color} ${activeNote === note.val ? 'ring-4 ring-emerald-400 scale-105' : ''}`}
              >
                <div className="flex items-center justify-center gap-0.5 leading-none">
                  <span className="text-[11px] sm:text-xs opacity-90 font-bold">Q$</span>
                  <span className="text-base sm:text-xl font-extrabold">{note.val}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cheerful Status Note */}
        <div className="w-full max-w-md mt-3 bg-white/80 backdrop-blur-md border border-sky-200/80 rounded-2xl p-3.5 shadow-xs text-center">
          <p className="text-xs sm:text-sm text-slate-700 font-semibold flex items-center justify-center gap-1.5">
            <span>🎒</span>
            <span>Nosso banco escolar está sendo preparado com muito carinho para todos os alunos!</span>
          </p>
        </div>

      </main>

      {/* Cheerful Light Footer */}
      <footer className="relative z-20 py-3.5 px-4 text-center border-t border-sky-200/70 bg-white/80 backdrop-blur-md">
        <p className="text-xs text-slate-600 font-bold flex items-center justify-center gap-2 flex-wrap">
          <span>Escola Municipal Metodista</span>
          <span className="text-sky-300">•</span>
          <span>Queimados / RJ</span>
          <span className="text-sky-300">•</span>
          <span className="text-emerald-700 font-extrabold flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 inline" /> Educação Financeira Infantil
          </span>
        </p>
      </footer>
    </div>
  );
}
