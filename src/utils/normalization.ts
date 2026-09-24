/**
 * Regras de normalização de dados do Banco Central da Escola Metodista:
 * - Todas as letras maiúsculas
 * - Sem acentos
 * - Ç convertido para C
 * - Sem espaços duplos
 */
export function normalizeStudentName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[Çç]/g, 'C') // Ç vira C
    .replace(/[^A-Za-z0-9 ]/g, '') // remove pontuações especiais mantendo letras e números
    .toUpperCase()
    .replace(/\s+/g, ' '); // remove espaços duplicados
}

/**
 * Normaliza número de conta (apenas dígitos ou alfanumérico limpo)
 */
export function normalizeAccountNumber(account: string): string {
  if (!account) return '';
  return account.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Formata moeda oficial Queimacash:
 * Ex: Q$ 25,00 ou Q$ 25
 */
export function formatQueimacash(valor: number, comCentavos: boolean = true): string {
  const safeVal = isNaN(valor) ? 0 : valor;
  if (!comCentavos && Number.isInteger(safeVal)) {
    return `Q$ ${safeVal}`;
  }
  return `Q$ ${safeVal.toFixed(2).replace('.', ',')}`;
}

/**
 * Gera número de protocolo único e legível
 * Exemplo: DEP-20260923-9481
 */
export function generateProtocol(prefix: 'DEP' | 'SAQ' | 'RES' | 'INV'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${rand}`;
}

/**
 * Formata data e hora para exibição em comprovantes e telas
 */
export function formatDateTime(dateStr?: string | Date): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
