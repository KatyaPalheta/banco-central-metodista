import React, { useEffect, useState } from 'react';
import {
  Filter,
  Upload,
  UserPlus,
  Search,
  Sparkles,
  Plus,
} from 'lucide-react';

import { Student, TurmaId } from '../../domain/types';
import { studentRepository } from '../../repositories/studentRepository';
import {
  turmaRepository,
  Turma,
} from '../../repositories/turmaRepository';

import { formatQueimacash } from '../../utils/normalization';
import { ExcelImportModal } from './ExcelImportModal';
import { AddStudentModal } from './AddStudentModal';
import { NewTurmaModal } from './NewTurmaModal';

export const ContasTab: React.FC = () => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] =
    useState<TurmaId>('');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingTurmas, setLoadingTurmas] =
    useState(true);

  const [showImportModal, setShowImportModal] =
    useState(false);

  const [showNewTurmaModal, setShowNewTurmaModal] =
  useState(false);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadTurmas = async () => {
    setLoadingTurmas(true);
    setErrorMessage(null);

    try {
      const list =
        await turmaRepository.getAll();

      setTurmas(list);

      if (list.length > 0) {
        setSelectedTurma((atual) => {
          const turmaAtualExiste =
            list.some(
              (turma) =>
                turma.codigo === atual
            );

          if (atual && turmaAtualExiste) {
            return atual;
          }

          return list[0].codigo;
        });
      } else {
        setSelectedTurma('');
      }
    } catch (error) {
      console.error(
        'Erro ao carregar turmas:',
        error
      );

      setErrorMessage(
        'Não foi possível carregar as turmas.'
      );
    } finally {
      setLoadingTurmas(false);
    }
  };

  const loadStudents = async () => {
    if (!selectedTurma) {
      setStudents([]);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const list =
        await studentRepository.getByTurma(
          selectedTurma
        );

      setStudents(list);
    } catch (error) {
      console.error(
        'Erro ao carregar alunos:',
        error
      );

      setErrorMessage(
        'Não foi possível carregar os alunos da turma.'
      );

      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTurmas();
  }, []);

  useEffect(() => {
    if (selectedTurma) {
      loadStudents();
    } else {
      setStudents([]);
    }
  }, [selectedTurma]);

  const filteredStudents =
    students.filter((student) => {
      if (!searchQuery.trim()) {
        return true;
      }

      const query =
        searchQuery
          .toLowerCase()
          .trim();

      return (
        student.nome
          .toLowerCase()
          .includes(query) ||
        student.numeroConta
          .toLowerCase()
          .includes(query)
      );
    });

  return (
    <div>
      {/* Toast */}
      {toastMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-600 text-white font-fredoka font-semibold shadow-md flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-5 h-5 text-amber-300" />

          <span>
            {toastMessage}
          </span>
        </div>
      )}

      {/* Erro */}
      {errorMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Cabeçalho */}
      <div className="mb-6">
        <h2 className="font-fredoka text-2xl font-bold text-slate-900">
          Gerenciamento de Contas por Turma
        </h2>

        <p className="text-xs text-slate-500">
          Selecione a turma para visualizar
          os alunos cadastrados e seus
          saldos oficiais.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-2 bg-white rounded-2xl border border-slate-200 shadow-xs">
        {/* Dropdown de Turmas */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Turma:
          </span>

          <select
            value={selectedTurma}
            onChange={(e) =>
              setSelectedTurma(
                e.target.value
              )
            }
            disabled={
              loadingTurmas ||
              turmas.length === 0
            }
            className="min-w-50 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
          >
            {loadingTurmas && (
              <option value="">
                Carregando...
              </option>
            )}

            {!loadingTurmas &&
              turmas.length === 0 && (
                <option value="">
                  Nenhuma turma
                </option>
              )}

            {!loadingTurmas &&
              turmas.map((turma) => (
                <option
                  key={turma.codigo}
                  value={turma.codigo}
                >
                  Turma {turma.codigo}
                </option>
              ))}
          </select>
          <button
  type="button"
  onClick={() => setShowNewTurmaModal(true)}
  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
>
  <Plus className="w-4 h-4" />
  NOVA TURMA
</button>
        </div>

        {/* Busca rápida */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            placeholder="Filtrar aluno ou conta..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Sem turma disponível */}
      {!loadingTurmas &&
      !selectedTurma ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6">
          <p className="font-fredoka text-lg text-slate-700">
            Nenhuma turma cadastrada.
          </p>
        </div>
      ) : loading ? (
        /* Carregamento */
        <div className="py-16 text-center text-slate-500 text-sm">
          Carregando alunos da Turma{' '}
          {selectedTurma}...
        </div>
      ) : filteredStudents.length === 0 ? (
        /* Turma sem alunos */
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6">
          <p className="font-fredoka text-lg text-slate-700 mb-1">
            Nenhum aluno cadastrado na
            Turma {selectedTurma}.
          </p>

          <p className="text-xs text-slate-500">
            Você pode importar a planilha
            da turma ou adicionar alunos
            utilizando os botões abaixo.
          </p>
        </div>
      ) : (
        /* Tabela */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">
                    Aluno
                  </th>

                  <th className="py-3.5 px-4">
                    Turma
                  </th>

                  <th className="py-3.5 px-4">
                    Número da Conta
                  </th>

                  <th className="py-3.5 px-4 text-right">
                    Saldo Oficial
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map(
                  (student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-sky-50/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {student.nome}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                          {
                            student.turma
                          }
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {
                          student.numeroConta
                        }
                      </td>

                      <td className="py-3.5 px-4 text-right font-fredoka font-bold text-base text-emerald-700">
                        {formatQueimacash(
                          student.saldo
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2 px-4">
            <span>
              Turma {selectedTurma}:{' '}
              <strong>
                {
                  filteredStudents.length
                }
              </strong>{' '}
              alunos
            </span>

            <span>
              Escola Municipal Metodista
              de Queimados
            </span>
          </div>
        </div>
      )}

      {/* Ações da Turma */}
      {selectedTurma && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">
            Gerenciamento da{' '}
            <strong>
              Turma {selectedTurma}
            </strong>
            :
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setShowImportModal(
                  true
                )
              }
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-fredoka font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />

              IMPORTAR ARQUIVO (.xlsx)
            </button>

            <button
              type="button"
              onClick={() =>
                setShowAddModal(true)
              }
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-fredoka font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />

              ADICIONAR ALUNO
            </button>
          </div>
        </div>
      )}

      {/* Modal Excel */}
      {showImportModal && (
        <ExcelImportModal
          onClose={() =>
            setShowImportModal(false)
          }
          onImportSuccess={(count) => {
            setShowImportModal(false);

            showToast(
              `${count} alunos importados com sucesso!`
            );

            loadStudents();
          }}
        />
      )}

      {/* Modal Adicionar Aluno */}
      {showAddModal && (
        <AddStudentModal
          initialTurma={selectedTurma}
          onClose={() =>
            setShowAddModal(false)
          }
          onSuccess={() => {
            setShowAddModal(false);

            showToast(
              'Novo aluno cadastrado com sucesso!'
            );

            loadStudents();
          }}
        />
      )}
      {showNewTurmaModal && (
  <NewTurmaModal
    onClose={() => setShowNewTurmaModal(false)}
    onSuccess={async (codigo) => {
      setShowNewTurmaModal(false);

      await loadTurmas();

      setSelectedTurma(codigo);

      showToast(
        `Turma ${codigo} criada com sucesso!`
      );
    }}
  />
)}
    </div>
  );
};