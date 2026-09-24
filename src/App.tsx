import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { CaixaView } from './views/CaixaView';
import { FamiliaView } from './views/FamiliaView';
import { ProfessorView } from './views/ProfessorView';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash;
      const path = window.location.pathname;
      if (['/caixa', '/familia', '/professor'].includes(path)) {
        return path;
      }
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentPath(hash);
      } else {
        const path = window.location.pathname;
        if (['/', '/caixa', '/familia', '/professor'].includes(path)) {
          setCurrentPath(path);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.location.hash = path;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-slate-50 to-emerald-50/40 text-slate-900 font-nunito">
      {/* Barra de Navegação Institucional */}
      <Navbar currentPath={currentPath} onNavigate={navigateTo} />

      {/* Conteúdo Principal das Telas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentPath === '/' && <HomeView onNavigate={navigateTo} />}
        {currentPath === '/caixa' && <CaixaView />}
        {currentPath === '/familia' && <FamiliaView />}
        {currentPath === '/professor' && <ProfessorView />}
      </main>
    </div>
  );
}
