import React, { useState, useEffect } from 'react';
import { Filter, Upload, UserPlus, Search, Sparkles } from 'lucide-react';
import { Student, TurmaId } from '../../domain/types';
import { studentRepository } from '../../repositories/studentRepository';
import { formatQueimacash } from '../../utils/normalization';
import { ExcelImportModal } from './ExcelImportModal';
import { AddStudentModal } from './AddStudentModal';

export const ContasTab: React.FC = () => {
  const [selectedTurma, setSelectedTurma] = useState<TurmaId>('401');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const list = await studentRepository.getByTurma(selectedTurma);
      setStudents(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedTurma]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtragem local por busca rápida (nome ou conta)
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return s.nome.toLowerCase().includes(query) || s.numeroConta.toLowerCase().includes(query);
  });

  return (
    <div>
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-600 text-white font-fredoka font-semibold shadow-md flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="mb-6">
        <h2 className="font-fredoka text-2xl font-bold text-slate-900">
          Gerenciamento de Contas por Turma
        </h2>
        <p className="text-xs text-slate-500">
          Selecione a turma para visualizar os alunos cadastrados e seus saldos oficiais.
        </p>
      </div>

      {/* Barra de Filtro de Turma e Busca por Nome */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-2 bg-white rounded-2xl border border-slate-200 shadow-xs">
        {/* Seletor de Turmas Separadas (sem Todas) */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Turma:
          </span>
          {(['401', '402', '501', '502'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTurma(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTurma === t
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Turma {t}
            </button>
          ))}
        </div>

        {/* Busca rápida */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar aluno ou conta..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Tabela de Alunos */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">
          Carregando alunos da Turma {selectedTurma}...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6">
          <p className="font-fredoka text-lg text-slate-700 mb-1">
            Nenhum aluno cadastrado na Turma {selectedTurma}.
          </p>
          <p className="text-xs text-slate-500">
            Você pode importar a planilha da turma ou adicionar alunos utilizando os botões abaixo.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Aluno</th>
                  <th className="py-3.5 px-4">Turma</th>
                  <th className="py-3.5 px-4">Número da Conta</th>
                  <th className="py-3.5 px-4 text-right">Saldo Oficial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-sky-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.nome}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                        {s.turma}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {s.numeroConta}
                    </td>
                    <td className="py-3.5 px-4 text-right font-fredoka font-bold text-base text-emerald-700">
                      {formatQueimacash(s.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center px-4">
            <span>Turma {selectedTurma}: <strong>{filteredStudents.length}</strong> alunos</span>
            <span>Escola Municipal Metodista de Queimados</span>
          </div>
        </div>
      )}

      {/* Ações da Turma no Rodapé */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs text-slate-500">
          Gerenciamento da <strong>Turma {selectedTurma}</strong>:
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-fredoka font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Upload className="w-4 h-4" />
            IMPORTAR ARQUIVO (.xlsx)
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-fredoka font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            ADICIONAR ALUNO
          </button>
        </div>
      </div>

      {/* Modal Importar Excel */}
      {showImportModal && (
        <ExcelImportModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={(count) => {
            setShowImportModal(false);
            showToast(`${count} alunos importados com sucesso!`);
            loadStudents();
          }}
        />
      )}

      {/* Modal Adicionar Aluno */}
      {showAddModal && (
        <AddStudentModal
          initialTurma={selectedTurma}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            showToast('Novo aluno cadastrado com sucesso!');
            loadStudents();
          }}
        />
      )}
    </div>
  );
};
