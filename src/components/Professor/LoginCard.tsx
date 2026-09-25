import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  Mail,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import { authService } from '../../services/authService';
import { soundService } from '../../services/soundService';

interface LoginCardProps {
  onSuccess: () => void;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await authService.login(
        email.trim(),
        password
      );

      if (res.success) {
        soundService.playSuccessSound();
        onSuccess();
        return;
      }

      setErrorMsg(
        res.error || 'Não foi possível entrar.'
      );
    } catch (error) {
      console.error(error);

      setErrorMsg(
        'Não foi possível acessar o sistema.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-sky-100 shadow-xl shadow-sky-900/10 text-center">

        <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
          Acesso da Equipe
        </h2>

        <p className="text-slate-600 text-xs sm:text-sm mb-6">
          Área restrita aos educadores e coordenação da
          Escola Municipal Metodista
        </p>

        <div className="mb-6 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-left flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />

          <div>
            <strong>Acesso protegido</strong>

            <p className="mt-0.5 text-emerald-800">
              Entre com o e-mail e a senha cadastrados
              para a equipe escolar.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <div className="text-left">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              E-mail
            </label>

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="text-left">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Senha
            </label>

            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Digite sua senha..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-fredoka font-bold text-base shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>
              {loading
                ? 'Entrando...'
                : 'ENTRAR NA ÁREA DA EQUIPE'}
            </span>

            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};