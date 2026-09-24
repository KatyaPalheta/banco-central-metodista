import React, { useState, useEffect } from 'react';
import { Student } from '../domain/types';
import { printerService, PrinterState } from '../services/printerService';
import { PrinterGate } from '../components/PrinterGate';
import { StudentSearch } from '../components/Caixa/StudentSearch';
import { StudentConfirm } from '../components/Caixa/StudentConfirm';
import { StudentPanel } from '../components/Caixa/StudentPanel';

export const CaixaView: React.FC = () => {
  const [printerState, setPrinterState] = useState<PrinterState>(printerService.getState());
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [stage, setStage] = useState<'search' | 'confirm' | 'panel'>('search');

  // Inscreve no estado da impressora Bluetooth em tempo real
  useEffect(() => {
    const unsub = printerService.subscribe((state) => {
      setPrinterState(state);
    });

    // Tenta reconexão automática ao abrir a tela
    printerService.tryAutoReconnect();

    return unsub;
  }, []);

  // Quando o aluno encerra a sessão, limpa completamente as variáveis
  const handleLogout = () => {
    setSelectedStudent(null);
    setStage('search');
  };

  const handleStudentSelectedFromSearch = (student: Student) => {
    setSelectedStudent(student);
    setStage('confirm');
  };

  const handleConfirmIdentity = () => {
    setStage('panel');
  };

  const handleCancelIdentity = () => {
    setSelectedStudent(null);
    setStage('search');
  };

  return (
    <div className="py-2">
      {/* O PrinterGate bloqueia toda e qualquer operação se a impressora não estiver conectada */}
      <PrinterGate printerState={printerState}>
        {stage === 'search' && (
          <StudentSearch onStudentSelected={handleStudentSelectedFromSearch} />
        )}

        {stage === 'confirm' && selectedStudent && (
          <StudentConfirm
            student={selectedStudent}
            onConfirm={handleConfirmIdentity}
            onCancel={handleCancelIdentity}
          />
        )}

        {stage === 'panel' && selectedStudent && (
          <StudentPanel
            student={selectedStudent}
            onLogout={handleLogout}
            onRefreshStudent={(updated) => setSelectedStudent(updated)}
          />
        )}
      </PrinterGate>
    </div>
  );
};
