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

export interface CicloFechamento {
  mesReferencia: string;
  dataLeituraAnterior: string;
  dataLeituraAtual: string;
  dataProximaLeitura: string;
}

export interface ItemConciliacao {
  unidade: string;
  consumo: number;
  valorHydrojexe: number;
  valorSergio: number;
  status: 'VERDADEIRO' | 'FALSO';
  diferenca: number;
  diferencaAbs: number;
  leituraAnterior?: number;
  leituraAtual?: number;
  tipoAnomalia?: 'NEGATIVO' | 'ALTO' | 'BAIXO_QUASE_ZERO' | 'NORMAL';
  observacao?: string;
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
  valorSergio: number,
  leituraAnterior?: number,
  leituraAtual?: number
): {
  valorHydrojexe: number;
  valorSergio: number;
  status: 'VERDADEIRO' | 'FALSO';
  diferenca: number;
  diferencaAbs: number;
  tipoAnomalia: 'NEGATIVO' | 'ALTO' | 'BAIXO_QUASE_ZERO' | 'NORMAL';
  observacao?: string;
} {
  const valorHydrojexe = calcularValorSabesp(consumoM3);
  const diffReal = Number((valorHydrojexe - valorSergio).toFixed(2));
  const diferencaAbs = Number(Math.abs(diffReal).toFixed(2));
  const status = diferencaAbs <= 0.02 ? 'VERDADEIRO' : 'FALSO';

  const anomalia = classificarConsumo(consumoM3);
  let observacao = anomalia.descricao;

  if (leituraAnterior !== undefined && leituraAtual !== undefined && leituraAtual < leituraAnterior) {
    observacao = `⚠️ ${unidade}: Leitura atual (${leituraAtual}) menor que anterior (${leituraAnterior}). Troca de cyble/gasômetro detectada.`;
  } else if (anomalia.alertaTrocaCyble) {
    observacao = `⚠️ ${unidade}: Consumo negativo detectado (${consumoM3} m³). Troca de cyble/gasômetro detectada.`;
  } else if (status === 'FALSO') {
    observacao = `Divergência apurada: Sabesp R$ ${valorHydrojexe.toFixed(2)} vs Sérgio R$ ${valorSergio.toFixed(2)} (${diffReal > 0 ? '+' : ''}${diffReal.toFixed(2)})`;
  }

  return {
    valorHydrojexe,
    valorSergio: Number(valorSergio.toFixed(2)),
    status,
    diferenca: diffReal,
    diferencaAbs,
    tipoAnomalia: anomalia.tipo,
    observacao
  };
}

/**
 * 3. Classificação de anomalias hidrométricas (Filtros operacionais do Notion)
 * Média de referência padrão para gás é 20 m³.
 */
export function classificarConsumo(consumo: number, mediaReferencia: number = 20): {
  tipo: 'NEGATIVO' | 'ALTO' | 'BAIXO_QUASE_ZERO' | 'NORMAL';
  descricao: string;
  alertaTrocaCyble: boolean;
} {
  if (consumo < 0) {
    return {
      tipo: 'NEGATIVO',
      descricao: 'Consumo negativo (Suspeita de troca física de hidrômetro/gasômetro)',
      alertaTrocaCyble: true
    };
  }
  if (consumo > 0 && consumo <= 0.5) {
    return {
      tipo: 'BAIXO_QUASE_ZERO',
      descricao: 'Consumo residual muito baixo (0,1 a 0,5 m³)',
      alertaTrocaCyble: false
    };
  }
  if (consumo > mediaReferencia * 1.5) {
    return {
      tipo: 'ALTO',
      descricao: `Consumo elevado acima da média (${consumo} m³ vs ref ${mediaReferencia} m³)`,
      alertaTrocaCyble: false
    };
  }
  return {
    tipo: 'NORMAL',
    descricao: 'Consumo dentro do padrão normal',
    alertaTrocaCyble: false
  };
}

/**
 * 4. Cálculo da Tarifa de Gás Comgás (16 Medidores) com expurgo de manutenção
 * Regra do Notion: Taxas de manutenção dos medidores da concessionária são
 * deduzidas do valor total antes de calcular a tarifa que vai para o Sérgio.
 */
export function calcularTarifaComgas(
  contas: ContaComgasMedidor[],
  valorManutencaoExpurgada: number = 0
): {
  totalBrutoRs: number;
  manutencaoExpurgadaRs: number;
  totalLiquidoRs: number;
  totalM3: number;
  tarifa: number;
  tarifaFormatada: string;
} {
  const totalBrutoRs = contas.reduce((acc, c) => acc + (c.valorRs || 0), 0);
  const totalM3 = contas.reduce((acc, c) => acc + (c.volumeM3 || 0), 0);
  
  const manutencaoLimpa = Math.max(0, isNaN(valorManutencaoExpurgada) ? 0 : valorManutencaoExpurgada);
  const totalLiquidoRs = Math.max(0, totalBrutoRs - manutencaoLimpa);

  // Tarifa líquida dividida pelo m3 total faturado
  const tarifa = totalM3 > 0 ? totalLiquidoRs / totalM3 : 0;

  return {
    totalBrutoRs: Number(totalBrutoRs.toFixed(2)),
    manutencaoExpurgadaRs: Number(manutencaoLimpa.toFixed(2)),
    totalLiquidoRs: Number(totalLiquidoRs.toFixed(2)),
    totalM3,
    tarifa: Number(tarifa.toFixed(4)),
    tarifaFormatada: tarifa.toFixed(2)
  };
}

/**
 * 5. Auditoria Cruzada Água x Gás (Regra 3:1 de disparidade)
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

/**
 * 6. Gerador do Relatório Oficial para o Sérgio (Word / WhatsApp)
 * Conforme instrução do Notion: "O que for falso documentar no Word e mandar para o Sérgio
 * e ver o porquê está diferente, anotar tudo."
 */
export function gerarRelatorioSergio(
  ciclo: CicloFechamento,
  itens: ItemConciliacao[],
  dadosGas?: {
    tarifaFormatada: string;
    manutencaoExpurgada: number;
    totalLiquidoRs: number;
    totalM3: number;
  }
): string {
  const divergencias = itens.filter(i => i.status === 'FALSO');
  const negativos = itens.filter(i => i.consumo < 0 || i.tipoAnomalia === 'NEGATIVO');
  const altos = itens.filter(i => i.tipoAnomalia === 'ALTO');
  const total = itens.length;
  const aprovados = total - divergencias.length;

  let texto = `*ACQUAPLAY HOME & RESORT — RELATÓRIO DE AUDITORIA & CONCILIAÇÃO*\n`;
  texto += `*Mês de Referência:* ${ciclo.mesReferencia}\n`;
  texto += `*Período de Medição:* ${ciclo.dataLeituraAnterior} até ${ciclo.dataLeituraAtual} (Próxima: ${ciclo.dataProximaLeitura})\n`;
  texto += `*Responsável Técnico:* Hydrojexe Individualizações\n`;
  texto += `--------------------------------------------------\n\n`;

  texto += `📌 *RESUMO EXECUTIVO*\n`;
  texto += `• Total de Unidades Auditadas: ${total.toLocaleString('pt-BR')}\n`;
  texto += `• Aprovados com Sabesp 2026 (VERDADEIRO): ${aprovados}\n`;
  texto += `• Divergências Identificadas (FALSO): ${divergencias.length}\n`;
  texto += `• Casos com Consumo Negativo / Troca Cyble: ${negativos.length}\n\n`;

  if (dadosGas) {
    texto += `🔥 *RATEIO COMGÁS*\n`;
    texto += `• Tarifa Aplicada no Rateio: R$ ${dadosGas.tarifaFormatada} / m³\n`;
    if (dadosGas.manutencaoExpurgada > 0) {
      texto += `• Manutenção Expurgada do Rateio: ${formatarMoedaBRL(dadosGas.manutencaoExpurgada)} (conforme instrução)\n`;
    }
    texto += `• Volume Total Faturado: ${formatarM3(dadosGas.totalM3, 0)} m³\n\n`;
  }

  if (divergencias.length > 0) {
    texto += `⚠️ *RELAÇÃO DE DIVERGÊNCIAS (FOLHA DO SÉRGIO x HYDROJEXE)*\n`;
    divergencias.forEach((d, idx) => {
      const diffSinal = d.diferenca > 0 ? `+${formatarMoedaBRL(d.diferenca)}` : formatarMoedaBRL(d.diferenca);
      texto += `${idx + 1}. *${d.unidade}*\n`;
      texto += `   - Consumo: ${formatarM3(d.consumo)} m³\n`;
      texto += `   - Valor Sabesp 2026: ${formatarMoedaBRL(d.valorHydrojexe)}\n`;
      texto += `   - Valor Sérgio: ${formatarMoedaBRL(d.valorSergio)}\n`;
      texto += `   - Diferença: ${diffSinal}\n`;
      if (d.observacao) texto += `   - Obs: ${d.observacao}\n`;
      texto += `\n`;
    });
  } else {
    texto += `✅ *Nenhuma divergência apurada entre a folha e a tabela Sabesp.*\n\n`;
  }

  if (negativos.length > 0) {
    texto += `🚨 *CONSUMOS NEGATIVOS / TROCA DE MEDIDOR (REQUER RETROATIVO)*\n`;
    negativos.forEach((n, idx) => {
      texto += `${idx + 1}. *${n.unidade}* (Consumo: ${formatarM3(n.consumo)} m³)\n`;
      texto += `   - Ação: Aplicar retroativo do antigo medidor e reiniciar contagem do novo medidor a partir do zero.\n`;
    });
    texto += `\n`;
  }

  if (altos.length > 0) {
    texto += `📈 *UNIDADES COM CONSUMO MUITO ACIMA DA MÉDIA*\n`;
    altos.slice(0, 15).forEach((a, idx) => {
      texto += `${idx + 1}. *${a.unidade}* — Consumo: ${formatarM3(a.consumo)} m³\n`;
    });
    if (altos.length > 15) {
      texto += `   ... e mais ${altos.length - 15} unidades.\n`;
    }
    texto += `\n`;
  }

  texto += `--------------------------------------------------\n`;
  texto += `Relatório gerado automaticamente pelo AcquaPlay Hub em ${new Date().toLocaleDateString('pt-BR')}.`;

  return texto;
}
