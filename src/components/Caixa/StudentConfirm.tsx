import React from 'react';
import { UserCheck, X, Check, ShieldCheck } from 'lucide-react';
import { Student } from '../../domain/types';
import { soundService } from '../../services/soundService';

interface StudentConfirmProps {
  student: Student;
  onConfirm: () => void;
  onCancel: () => void;
}

export const StudentConfirm: React.FC<StudentConfirmProps> = ({
  student,
  onConfirm,
  onCancel,
}) => {
  const handleYes = () => {
    soundService.playSuccessSound();
    onConfirm();
  };

  const handleNo = () => {
    soundService.playNoteSound(10);
    onCancel();
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-2 border-sky-100 shadow-xl shadow-sky-900/10 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-4">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Confirmação de Titular da Conta</span>
        </div>

        <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Este é você?
        </h2>
        <p className="text-slate-600 text-sm mb-6">
          Por favor, verifique com atenção os seus dados antes de abrir a sua conta.
        </p>

        {/* Cartão com dados do aluno (SEM EXIBIR SALDO!) */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 mb-8 text-left space-y-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Nome Completo do Aluno
            </span>
            <div className="font-fredoka text-xl sm:text-2xl font-bold text-slate-900">
              {student.nome}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-sky-200/60">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Turma
              </span>
              <div className="font-fredoka text-lg font-bold text-blue-700">
                Turma {student.turma}
                <span className="text-xs font-nunito font-semibold text-slate-600 ml-1">
                  ({student.turma.endsWith('1') ? 'Manhã' : 'Tarde'})
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                Número da Conta
              </span>
              <div className="font-fredoka text-lg font-bold text-slate-800">
                {student.numeroConta}
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação: NÃO e SIM */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleNo}
            className="py-4 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-fredoka font-bold text-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <X className="w-5 h-5 text-rose-500" />
            NÃO, VOLTAR
          </button>

          <button
            type="button"
            onClick={handleYes}
            className="py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-fredoka font-bold text-lg shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-5 h-5 text-white" />
            SIM, SOU EU!
          </button>
        </div>
      </div>
    </div>
  );
};
