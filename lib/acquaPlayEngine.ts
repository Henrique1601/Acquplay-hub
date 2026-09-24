// lib/acquaPlayEngine.ts

export interface ContaComgasMedidor {
  codigoConta: number | string;
  blocoMedidor: string;
  valorRs: number;
  volumeM3: number;
}

export interface UnidadeLeituraInput {
  unidade: string;
  leituraAnterior: number;
  leituraAtual: number;
}

export interface ItemConciliacao {
  unidade: string;
  consumo: number;
  valorHydrojexe: number;
  valorSergio: number;
  status: 'VERDADEIRO' | 'FALSO';
  diferenca: number;
  diferencaAbs: number;
}

/**
 * Converte valores numéricos flexíveis (ex: "12,84", "R$ 113,16", 12.84, undefined)
 * para number de ponto flutuante padrão JS, com segurança contra NaN.
 */
export function parseNumeroBR(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (val === null || val === undefined) {
    return 0;
  }

  const str = String(val).trim();
  if (!str) return 0;

  // Remove caracteres que não sejam dígitos, sinal de menos ou vírgula/ponto
  // Trata formato brasileiro (1.234,56 -> 1234.56 ou 12,84 -> 12.84)
  const limpo = str.replace(/[^0-9,.-]/g, '');
  
  if (limpo.includes(',') && limpo.includes('.')) {
    // Se tem ponto e vírgula, assume que ponto é milhar e vírgula é decimal
    const normalizado = limpo.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalizado);
    return isNaN(parsed) ? 0 : parsed;
  } else if (limpo.includes(',')) {
    const normalizado = limpo.replace(',', '.');
    const parsed = parseFloat(normalizado);
    return isNaN(parsed) ? 0 : parsed;
  }

  const parsed = parseFloat(limpo);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata valor numérico para Moeda Brasileira (R$)
 */
export function formatarMoedaBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(valor) ? 0 : valor);
}

/**
 * Formata consumo em metros cúbicos (m³)
 */
export function formatarM3(valor: number, decimais = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(isNaN(valor) ? 0 : valor);
}

/**
 * 1. Tabela Sabesp Residencial 2026 (Água + Esgoto)
 * Faixas progressivas:
 * - 0 a 10 m³: Tarifa mínima fixa R$ 80,84
 * - 11 a 20 m³: R$ 80,84 + (m³ - 10) * R$ 11,38
 * - 21 a 50 m³: R$ 80,84 + (10 * 11,38) + (m³ - 20) * R$ 15,06 (base R$ 194,64)
 * - Acima de 50 m³: R$ 194,64 + (30 * 15,06) + (m³ - 50) * R$ 20,40 (base R$ 646,44)
 */
export function calcularValorSabesp(consumoM3: number): number {
  if (isNaN(consumoM3) || consumoM3 <= 0) {
    return 80.84;
  }

  const m3 = consumoM3;

  if (m3 <= 10) {
    return 80.84;
  } else if (m3 <= 20) {
    return Number((80.84 + (m3 - 10) * 11.38).toFixed(2));
  } else if (m3 <= 50) {
    return Number((194.64 + (m3 - 20) * 15.06).toFixed(2));
  } else {
    return Number((646.44 + (m3 - 50) * 20.40).toFixed(2));
  }
}

/**
 * 2. Conciliação com a folha do Sérgio (Conta Justa)
 * Considera tolerância contábil de R$ 0,02 para desvios de arredondamento.
 */
export function conciliarComSergio(
  unidade: string,
  consumoM3: number,
  valorSergio: number
): {
  valorHydrojexe: number;
  valorSergio: number;
  status: 'VERDADEIRO' | 'FALSO';
  diferenca: number;
  diferencaAbs: number;
} {
  const valorHydrojexe = calcularValorSabesp(consumoM3);
  const diffReal = Number((valorHydrojexe - valorSergio).toFixed(2));
  const diferencaAbs = Number(Math.abs(diffReal).toFixed(2));
  const status = diferencaAbs <= 0.02 ? 'VERDADEIRO' : 'FALSO';

  return {
    valorHydrojexe,
    valorSergio: Number(valorSergio.toFixed(2)),
    status,
    diferenca: diffReal,
    diferencaAbs
  };
}

/**
 * 3. Cálculo da Tarifa de Gás Comgás (16 Medidores)
 * Retorna tanto a tarifa calculada com alta precisão (4 casas decimais para rateio)
 * quanto os totais consolidados.
 */
export function calcularTarifaComgas(contas: ContaComgasMedidor[]): {
  totalRs: number;
  totalM3: number;
  tarifa: number;
  tarifaFormatada: string;
} {
  const totalRs = contas.reduce((acc, c) => acc + (c.valorRs || 0), 0);
  const totalM3 = contas.reduce((acc, c) => acc + (c.volumeM3 || 0), 0);
  
  // No rateio condominial, a tarifa precisa de pelo menos 4 a 6 casas para evitar desvios no fechamento
  const tarifa = totalM3 > 0 ? totalRs / totalM3 : 0;

  return {
    totalRs: Number(totalRs.toFixed(2)),
    totalM3,
    tarifa: Number(tarifa.toFixed(4)),
    tarifaFormatada: tarifa.toFixed(2)
  };
}

/**
 * 4. Auditoria Cruzada Água x Gás (Regra 3:1 de disparidade)
 * Detecta hidrômetros travados, fraudes ou inconsistências de leitura.
 */
export function auditarAguaGas(agua: number, gas: number): {
  vistoriarGas: boolean;
  vistoriarAgua: boolean;
  motivo?: string;
} {
  const consumoAgua = Math.max(0, isNaN(agua) ? 0 : agua);
  const consumoGas = Math.max(0, isNaN(gas) ? 0 : gas);

  const vistoriarGas = (consumoAgua >= 3 * consumoGas && consumoAgua > 0) || (consumoAgua > 0 && consumoGas === 0);
  const vistoriarAgua = (consumoGas >= 3 * consumoAgua && consumoGas > 0) || (consumoGas > 0 && consumoAgua === 0);

  let motivo: string | undefined;
  if (vistoriarGas && consumoGas === 0 && consumoAgua > 0) {
    motivo = 'Consumo de água ativo porém gás zerado (possível medidor de gás parado)';
  } else if (vistoriarGas) {
    motivo = 'Consumo de água 3x superior ao gás (disparidade acentuada)';
  } else if (vistoriarAgua && consumoAgua === 0 && consumoGas > 0) {
    motivo = 'Consumo de gás ativo porém água zerada (possível hidrômetro travado)';
  } else if (vistoriarAgua) {
    motivo = 'Consumo de gás 3x superior à água (disparidade acentuada)';
  }

  return { vistoriarGas, vistoriarAgua, motivo };
}