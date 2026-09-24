/**
 * =========================================================================
 * GERADOR ESC/POS PARA IMPRESSORA TÉRMICA BLUETOOTH 58MM (32 COLUNAS)
 * =========================================================================
 * Compatível com mini impressoras térmicas ESC/POS (Baihuo / POS-58 / MPT-II).
 * Utiliza codificação CP850 (Multilingual) para português e suporte a acentos.
 */

// Comandos ESC/POS canônicos
export const ESC = 0x1b;
export const GS = 0x1d;

export class EscPosBuilder {
  private buffer: number[] = [];
  private readonly maxCols = 32;

  constructor() {
    this.init();
  }

  /**
   * Inicializa a impressora e define a página de códigos CP850 (Multilingual)
   */
  init(): this {
    this.buffer.push(ESC, 0x40); // ESC @ : Inicializa impressora
    this.buffer.push(ESC, 0x74, 0x02); // ESC t 2 : Seleciona CP850
    return this;
  }

  alignLeft(): this {
    this.buffer.push(ESC, 0x61, 0x00);
    return this;
  }

  alignCenter(): this {
    this.buffer.push(ESC, 0x61, 0x01);
    return this;
  }

  alignRight(): this {
    this.buffer.push(ESC, 0x61, 0x02);
    return this;
  }

  bold(enable = true): this {
    this.buffer.push(ESC, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  normalSize(): this {
    this.buffer.push(GS, 0x21, 0x00);
    return this;
  }

  doubleHeight(): this {
    this.buffer.push(GS, 0x21, 0x01);
    return this;
  }

  doubleSize(): this {
    this.buffer.push(GS, 0x21, 0x11);
    return this;
  }

  lineFeed(lines = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  cut(): this {
    this.lineFeed(4);
    // GS V 66 0 : Partial cut
    this.buffer.push(GS, 0x56, 0x42, 0x00);
    return this;
  }

  /**
   * Converte caractere para byte CP850
   */
  private charToCp850(char: string): number {
    const cp850Map: Record<string, number> = {
      Á: 0xb5,
      á: 0xa0,
      À: 0xb7,
      à: 0x85,
      Ã: 0xc6,
      ã: 0xc7,
      Â: 0xb6,
      â: 0x83,
      É: 0x90,
      é: 0x82,
      Ê: 0xd2,
      ê: 0x88,
      Í: 0xd6,
      í: 0xa1,
      Ó: 0xe0,
      ó: 0xa2,
      Õ: 0xe5,
      õ: 0xe4,
      Ô: 0xe2,
      ô: 0x93,
      Ú: 0xe9,
      ú: 0xa3,
      Ü: 0x9a,
      ü: 0x81,
      Ç: 0x80,
      ç: 0x87,
      º: 0xa7,
      ª: 0xa6,
    };

    if (cp850Map[char] !== undefined) {
      return cp850Map[char];
    }

    const code = char.charCodeAt(0);
    if (code <= 127) {
      return code;
    }

    // Normalização defensiva para caractere sem acento se não mapeado
    const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.charCodeAt(0) <= 127 ? normalized.charCodeAt(0) : 0x20;
  }

  /**
   * Escreve texto cru aplicando quebra de linhas respeitando palavras
   */
  text(textStr: string): this {
    for (let i = 0; i < textStr.length; i++) {
      this.buffer.push(this.charToCp850(textStr[i]));
    }
    return this;
  }

  textLine(textStr: string): this {
    const wrappedLines = this.wrapText(textStr, this.maxCols);
    for (const line of wrappedLines) {
      this.text(line);
      this.lineFeed();
    }
    return this;
  }

  /**
   * Imprime uma linha de separação
   */
  divider(char = '-'): this {
    const line = char.repeat(this.maxCols);
    this.text(line);
    this.lineFeed();
    return this;
  }

  /**
   * Linha de chave e valor alinhada aos extremos (32 colunas)
   * Ex: "TURMA:                      401"
   */
  keyValue(label: string, value: string): this {
    const spaceCount = this.maxCols - (label.length + value.length);
    if (spaceCount >= 1) {
      const line = label + ' '.repeat(spaceCount) + value;
      this.text(line);
      this.lineFeed();
    } else {
      this.textLine(label);
      this.alignRight();
      this.textLine(value);
      this.alignLeft();
    }
    return this;
  }

  /**
   * Algoritmo de quebra de linha sem partir palavras no meio
   */
  private wrapText(str: string, maxLen: number): string[] {
    const words = str.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length === 0) {
        if (word.length <= maxLen) {
          currentLine = word;
        } else {
          // Palavra maior que a linha (caso extremo)
          lines.push(word.substring(0, maxLen));
          currentLine = word.substring(maxLen);
        }
      } else if (currentLine.length + 1 + word.length <= maxLen) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    return lines;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * =========================================================================
 * MODELOS DE COMPROVANTES DO BANCO CENTRAL DA ESCOLA METODISTA
 * =========================================================================
 */

export interface ReceiptData {
  tipo: 'DEPOSITO' | 'SAQUE' | 'INVESTIMENTO_APLICACAO' | 'INVESTIMENTO_RESGATE';
  protocolo: string;
  dataHora: string;
  nomeAluno: string;
  turma: string;
  numeroConta: string;
  valor: number;
  detalhes?: {
    opcaoInvestimento?: string;
    prazoDias?: number;
    dataVencimento?: string;
    rendimentoBruto?: number;
    penalidade?: number;
    valorLiquido?: number;
  };
}

export function buildReceiptBytes(data: ReceiptData): Uint8Array {
  const b = new EscPosBuilder();

  // Cabeçalho institucional obrigatório
  b.alignCenter();
  b.bold(true);
  b.doubleHeight();
  b.textLine('BANCO CENTRAL');
  b.textLine('DA ESCOLA METODISTA');
  b.normalSize();
  b.bold(false);
  b.textLine('PROJETO EDUCACAO FINANCEIRA');
  b.divider('=');

  // Tipo de comprovante
  b.bold(true);
  if (data.tipo === 'DEPOSITO') {
    b.textLine('COMPROVANTE DE DEPOSITO');
  } else if (data.tipo === 'SAQUE') {
    b.textLine('COMPROVANTE DE SAQUE');
  } else if (data.tipo === 'INVESTIMENTO_APLICACAO') {
    b.textLine('APLICACAO EM INVESTIMENTO');
  } else if (data.tipo === 'INVESTIMENTO_RESGATE') {
    b.textLine('RESGATE DE INVESTIMENTO');
  }
  b.bold(false);
  b.divider('-');

  // Dados da identificação
  b.alignLeft();
  b.keyValue('PROTOCOLO:', data.protocolo);
  b.keyValue('DATA/HORA:', data.dataHora);
  b.divider('.');
  b.keyValue('ALUNO:', data.nomeAluno);
  b.keyValue('TURMA:', data.turma);
  b.keyValue('CONTA:', data.numeroConta);
  b.divider('.');

  // Dados financeiros
  b.bold(true);
  b.keyValue('VALOR:', `Q$ ${data.valor.toFixed(2).replace('.', ',')}`);
  b.bold(false);

  // Detalhes de investimento se houver
  if (data.detalhes?.opcaoInvestimento) {
    b.keyValue('MODALIDADE:', data.detalhes.opcaoInvestimento);
  }
  if (data.detalhes?.prazoDias !== undefined) {
  b.keyValue(
    'PRAZO:',
    `${data.detalhes.prazoDias} ${data.detalhes.prazoDias === 1 ? 'dia' : 'dias'}`
  );
}

if (data.detalhes?.dataVencimento) {
  b.keyValue('VENCIMENTO:', data.detalhes.dataVencimento);
}
  if (data.detalhes?.penalidade && data.detalhes.penalidade > 0) {
    b.keyValue('PENALIDADE:', `- Q$ ${data.detalhes.penalidade.toFixed(2).replace('.', ',')}`);
  }
  if (data.detalhes?.valorLiquido !== undefined) {
    b.bold(true);
    b.keyValue('A RECEBER:', `Q$ ${data.detalhes.valorLiquido.toFixed(2).replace('.', ',')}`);
    b.bold(false);
  }

  b.divider('=');

  // Mensagens obrigatórias por tipo de operação
  b.alignCenter();
  b.bold(true);

  if (
    data.tipo === 'DEPOSITO' ||
    data.tipo === 'SAQUE' ||
    data.tipo === 'INVESTIMENTO_RESGATE'
  ) {
    b.textLine('*** OPERACAO PENDENTE ***');
    b.lineFeed();
    b.textLine('APRESENTE ESTE COMPROVANTE');
    b.textLine('AO PROFESSOR');
    b.bold(false);
    b.lineFeed();
    b.textLine('O saldo so sera atualizado');
    b.textLine('apos confirmacao escolar.');
  } else if (data.tipo === 'INVESTIMENTO_APLICACAO') {
    b.textLine('APLICACAO EFETIVADA');
    b.lineFeed();
    b.bold(false);
    b.textLine('Seu Queimacash ja esta rendendo!');
    b.textLine('Nao necessita de confirmacao');
    b.textLine('do professor.');
  }

  b.lineFeed(2);
  b.divider('-');
  b.textLine('ESCOLA METODISTA DE QUEIMADOS');
  b.textLine('Cuidando do seu futuro');

  b.cut();
  return b.getBytes();
}
