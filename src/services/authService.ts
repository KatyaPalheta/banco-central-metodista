/**
 * =========================================================================
 * SERVIÇO DE AUTENTICAÇÃO MOCK TEMPORÁRIO (PROFESSOR)
 * =========================================================================
 * AVISO ARQUITETURAL IMPORTANTE:
 * Esta autenticação é estritamente temporária para esta fase de validação
 * pedagógica e testes locais. NÃO representa a solução definitiva de segurança
 * de produção (que será posteriormente integrada com Supabase Auth/RBAC).
 */

const SESSION_STORAGE_KEY = 'bcem_teacher_auth_session';

// Senha centralizada de teste para acesso administrativo do professor
export const TEMPORARY_TEACHER_PASSWORD = 'metodista2026';

export interface AuthSession {
  isAuthenticated: boolean;
  username: string;
  loginTime: string;
}

class AuthService {
  private currentSession: AuthSession | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch {
      this.currentSession = null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentSession?.isAuthenticated;
  }

  getSession(): AuthSession | null {
    return this.currentSession;
  }

  async login(password: string): Promise<{ success: boolean; error?: string }> {
    // Simula pequena latência de verificação
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (password === TEMPORARY_TEACHER_PASSWORD) {
      const session: AuthSession = {
        isAuthenticated: true,
        username: 'Professor / Coordenação',
        loginTime: new Date().toISOString(),
      };
      this.currentSession = session;
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      return { success: true };
    }

    return {
      success: false,
      error: 'Senha incorreta. Verifique a senha temporária do projeto.',
    };
  }

  logout(): void {
    this.currentSession = null;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export const authService = new AuthService();
