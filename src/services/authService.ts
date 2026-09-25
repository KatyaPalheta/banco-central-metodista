import { supabase } from '../lib/supabase';

export interface AuthSession {
  isAuthenticated: boolean;
  userId: string;
  email: string;
  loginTime: string;
}

class AuthService {
  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Erro ao recuperar sessão:', error);
      return null;
    }

    const session = data.session;

    if (!session?.user) {
      return null;
    }

    return {
      isAuthenticated: true,
      userId: session.user.id,
      email: session.user.email ?? '',
      loginTime: new Date().toISOString(),
    };
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session?.isAuthenticated;
  }

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro de login:', error);

      return {
        success: false,
        error: 'E-mail ou senha inválidos.',
      };
    }

    return {
      success: true,
    };
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erro ao sair:', error);
    }
  }

  onAuthStateChange(
    callback: (authenticated: boolean) => void
  ): () => void {
    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        callback(!!session);
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }
}

export const authService = new AuthService();