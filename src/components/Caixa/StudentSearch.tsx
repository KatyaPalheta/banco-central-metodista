import React, { useState } from 'react';
import { Search, UserCheck, Hash, GraduationCap, ArrowRight } from 'lucide-react';
import { Student, TurmaId } from '../../domain/types';
import { studentRepository } from '../../repositories/studentRepository';
import { soundService } from '../../services/soundService';

interface StudentSearchProps {
  onStudentSelected: (student: Student) => void;
}

export const StudentSearch: React.FC<StudentSearchProps> = ({ onStudentSelected }) => {
  const [searchMode, setSearchMode] = useState<'account' | 'turmaName'>('account');
  const [accountInput, setAccountInput] = useState('');
  const [selectedTurma, setSelectedTurma] = useState<TurmaId>('401');
  const [nameInput, setNameInput] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearchByAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSearched(true);
    if (!accountInput.trim()) {
      setErrorMsg('Por favor, digite o número da conta.');
      return;
    }

    const found = await studentRepository.getByAccountNumber(accountInput);
    if (found) {
      soundService.playNoteSound(20);
      onStudentSelected(found);
    } else {
      setErrorMsg(`Conta "${accountInput.trim()}" não encontrada. Verifique com seu professor.`);
      setSearchResults([]);
    }
  };

  const handleSearchByTurmaAndName = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSearched(true);
    if (!nameInput.trim()) {
      setErrorMsg('Digite pelo menos parte do seu nome.');
      return;
    }

    const results = await studentRepository.searchByTurmaAndName(selectedTurma, nameInput);
    setSearchResults(results);
    if (results.length === 0) {
      setErrorMsg(`Nenhum aluno encontrado na Turma ${selectedTurma} com o nome "${nameInput}".`);
    } else if (results.length === 1) {
      soundService.playNoteSound(20);
      onStudentSelected(results[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cabeçalho acolhedor */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
          <span>🎒</span>
          <span>Identificação do Aluno</span>
        </div>
        <h1 className="font-fredoka text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
          Bem-vindo ao Caixa Eletrônico!
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          Como você deseja localizar sua conta escolar hoje?
        </p>
      </div>

      {/* Seletor de Modo de Busca */}
      <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-white/70 backdrop-blur-md rounded-2xl border border-sky-100 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setSearchMode('account');
            setErrorMsg(null);
            setSearched(false);
          }}
          className={`py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
            searchMode === 'account'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Hash className="w-4 h-4" />
          Número da Conta
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchMode('turmaName');
            setErrorMsg(null);
            setSearched(false);
          }}
          className={`py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
            searchMode === 'turmaName'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Turma e Nome
        </button>
      </div>

      {/* Formulário Modo 1: Número da Conta */}
      {searchMode === 'account' && (
        <form
          onSubmit={handleSearchByAccount}
          className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-xl shadow-sky-900/5"
        >
          <label className="block text-slate-700 font-bold text-sm sm:text-base mb-3 text-center">
            Digite o número da sua conta escolar:
          </label>

          <div className="relative mb-6">
            <input
              type="text"
              value={accountInput}
              onChange={(e) => setAccountInput(e.target.value)}
              placeholder="Ex: 40101"
              autoFocus
              className="w-full text-center text-3xl sm:text-4xl font-fredoka font-bold tracking-wider py-4 px-6 rounded-2xl bg-sky-50/70 border-2 border-sky-200 focus:border-blue-500 focus:bg-white focus:outline-hidden text-slate-900 placeholder:text-slate-400 placeholder:text-2xl"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-fredoka font-bold text-lg sm:text-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            LOCALIZAR MINHA CONTA
          </button>
        </form>
      )}

      {/* Formulário Modo 2: Turma + Nome */}
      {searchMode === 'turmaName' && (
        <form
          onSubmit={handleSearchByTurmaAndName}
          className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-xl shadow-sky-900/5"
        >
          {/* Seleção de Turma */}
          <div className="mb-6">
            <label className="block text-slate-700 font-bold text-sm mb-2">
              1. Selecione a sua turma:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['401', '402', '501', '502'] as TurmaId[]).map((turma) => (
                <button
                  key={turma}
                  type="button"
                  onClick={() => setSelectedTurma(turma)}
                  className={`py-3 px-3 rounded-2xl font-fredoka text-lg font-bold transition-all cursor-pointer ${
                    selectedTurma === turma
                      ? 'bg-blue-600 text-white shadow-md ring-3 ring-blue-200'
                      : 'bg-sky-50 text-slate-700 hover:bg-sky-100 border border-sky-200'
                  }`}
                >
                  Turma {turma}
                  <span className="block text-[11px] font-nunito font-semibold opacity-80">
                    {turma.endsWith('1') ? 'Manhã' : 'Tarde'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Nome do Aluno */}
          <div className="mb-6">
            <label className="block text-slate-700 font-bold text-sm mb-2">
              2. Digite seu primeiro nome ou nome completo:
            </label>
            <div className="relative">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ex: Lucas ou Maria"
                className="w-full text-lg sm:text-xl font-bold py-3.5 px-4 rounded-2xl bg-sky-50/70 border-2 border-sky-200 focus:border-blue-500 focus:bg-white focus:outline-hidden text-slate-900 uppercase placeholder:normal-case placeholder:font-normal"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-fredoka font-bold text-lg sm:text-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Search className="w-5 h-5" />
            BUSCAR ALUNO
          </button>
        </form>
      )}

      {/* Alertas de erro */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold text-center">
          {errorMsg}
        </div>
      )}

      {/* Lista de Alunos Encontrados (SEMPRE SEM EXIBIR SALDO!) */}
      {searched && searchResults.length > 1 && (
        <div className="mt-6 bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-sky-100 shadow-lg">
          <h3 className="font-fredoka text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Encontramos mais de um aluno. Qual deles é você?
          </h3>
          <div className="divide-y divide-slate-100">
            {searchResults.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  soundService.playNoteSound(20);
                  onStudentSelected(student);
                }}
                className="w-full text-left py-4 px-3 rounded-xl hover:bg-sky-50/80 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-fredoka text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600">
                    {student.nome}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">
                    Turma {student.turma} ({student.turma.endsWith('1') ? 'Manhã' : 'Tarde'}) · Conta nº {student.numeroConta}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-blue-600 font-bold text-sm">
                  <span>Selecionar</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
