// lib/acquaPlayEngine.ts
import * as XLSX from 'xlsx';

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

export interface MedicaoIndividual {
  unidade: string;
  torre: string;
  leituraAnterior?: number;
  leituraAtual?: number;
  consumo: number;
  valorCalculado?: number;
  tipoAnomalia?: 'NEGATIVO' | 'ALTO' | 'BAIXO_QUASE_ZERO' | 'NORMAL';
  observacao?: string;
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
  leituraAnteriorSergio?: number;
  leituraAtualSergio?: number;
  consumoSergio?: number;
  tipoAnomalia?: 'NEGATIVO' | 'ALTO' | 'BAIXO_QUASE_ZERO' | 'NORMAL';
  observacao?: string;

  // Campos específicos de gás e consolidação
  torre?: string;
  leituraAnteriorGas?: number;
  leituraAtualGas?: number;
  consumoGas?: number;
  leituraAnteriorGasSergio?: number;
  leituraAtualGasSergio?: number;
  consumoGasSergio?: number;
  tarifaGasTorre?: number;
  valorGasHydrojexe?: number;
  valorGasSergio?: number;
  statusGas?: 'VERDADEIRO' | 'FALSO' | 'SERGIO_ZERADO';
  diferencaGas?: number;

  // Total combinado
  valorTotalHydrojexe?: number;
  valorTotalSergio?: number;
}

export const MEDIDORES_COMGAS_ACQUAPLAY: Record<string, string> = {
  '30267218': 'BLOCO A - MEDIDOR 1',
  '30461499': 'BLOCO A - MEDIDOR 2',
  '30446422': 'BLOCO B - MEDIDOR 1',
  '30461286': 'BLOCO B - MEDIDOR 2',
  '30446732': 'BLOCO C - MEDIDOR 1',
  '30461669': 'BLOCO C - MEDIDOR 2',
  '30449170': 'BLOCO D - MEDIDOR 1',
  '30461863': 'BLOCO D - MEDIDOR 2',
  '30461413': 'BLOCO E - MEDIDOR 1',
  '30446945': 'BLOCO E - MEDIDOR 2',
  '30449197': 'BLOCO F - MEDIDOR 1',
  '30461430': 'BLOCO F - MEDIDOR 2',
  '30449219': 'BLOCO G - MEDIDOR 1',
  '30461456': 'BLOCO G - MEDIDOR 2',
  '30462266': 'BLOCO H - MEDIDOR 1',
  '30466377': 'BLOCO H - MEDIDOR 2',
};

/**
 * Normaliza identificadores de apartamento para cruzamento exato entre planilhas
 * Ex: "Torre A-APTO0031", "Torre A  APTO  0031", "Torre A 0031" -> "TORRE A-APTO0031"
 */
export function normalizarChaveUnidade(unidade: string): string {
  const str = (unidade || '').toUpperCase().trim();
  const torre = extrairTorre(str);
  const matchApto = str.match(/(?:APTO|APT|AP)?\s*[-_/\s]?\s*0*(\d{1,4})\s*$/);
  if (matchApto) {
    const num = matchApto[1].padStart(4, '0');
    return `${torre}-APTO${num}`;
  }
  return str.replace(/\s+/g, ' ');
}

export interface TarifaPorMedidor {
  codigo: string | number;
  bloco: string;
  torre: string;
  valorRs: number;
  volumeM3: number;
  tarifa: number;
  tarifaFormatada: string;
}

/**
 * Converte valores numéricos flexíveis (ex: "12,84", "R$ 113,16", 12.84, undefined, "-")
 * para number de ponto flutuante padrão JS, com segurança contra NaN e formatos brasileiros.
 */
export function parseNumeroBR(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (val === null || val === undefined) {
    return 0;
  }

  const str = String(val).trim();
  if (!str || str === '-' || str === '--') return 0;

  // Remove símbolos monetários, espaços, etc.
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
 * Extrai a Torre/Bloco de um identificador de apartamento (ex: "Torre A-APTO0031", "BLOCO B - 12", "TORRE C / 45")
 */
export function extrairTorre(unidade: string): string {
  const str = (unidade || '').toUpperCase().trim();
  
  const matchTorre = str.match(/TORRE\s*([A-H1-8])/i) || str.match(/BLOCO\s*([A-H1-8])/i);
  if (matchTorre) {
    const letraOuNum = matchTorre[1];
    const mapaNum: Record<string, string> = {
      '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E', '6': 'F', '7': 'G', '8': 'H'
    };
    const letra = mapaNum[letraOuNum] || letraOuNum;
    return `TORRE ${letra}`;
  }

  // Padrão A-123 ou T-A-123
  const matchInicial = str.match(/^(?:T-)?([A-H])[-_\s]/);
  if (matchInicial) {
    return `TORRE ${matchInicial[1]}`;
  }

  // Padrão no meio: "- A -" ou " A /"
  const matchMeio = str.match(/[-_\s]([A-H])[-_\s/]/);
  if (matchMeio) {
    return `TORRE ${matchMeio[1]}`;
  }

  return 'TORRE A'; // Fallback padrão
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
 * A fórmula da tarifa de cada medidor/torre é: Preço da conta dividido pelo consumo daquele medidor.
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
  tarifasPorTorre: Record<string, number>;
  medidoresDetalhados: TarifaPorMedidor[];
} {
  const totalBrutoRs = contas.reduce((acc, c) => acc + (c.valorRs || 0), 0);
  const totalM3 = contas.reduce((acc, c) => acc + (c.volumeM3 || 0), 0);
  
  const manutencaoLimpa = Math.max(0, isNaN(valorManutencaoExpurgada) ? 0 : valorManutencaoExpurgada);
  const totalLiquidoRs = Math.max(0, totalBrutoRs - manutencaoLimpa);

  // Tarifa líquida média
  const tarifaMedia = totalM3 > 0 ? totalLiquidoRs / totalM3 : 0;
  const fatorLiquido = totalBrutoRs > 0 ? totalLiquidoRs / totalBrutoRs : 1;

  // Calcula tarifa individual de cada um dos 16 medidores
  const medidoresDetalhados: TarifaPorMedidor[] = contas.map(c => {
    const torre = extrairTorre(c.blocoMedidor);
    const vol = c.volumeM3 || 0;
    const valorLiq = (c.valorRs || 0) * fatorLiquido;
    const tarifa = vol > 0 ? valorLiq / vol : tarifaMedia;

    return {
      codigo: c.codigoConta,
      bloco: c.blocoMedidor,
      torre,
      valorRs: Number((c.valorRs || 0).toFixed(2)),
      volumeM3: vol,
      tarifa: Number(tarifa.toFixed(4)),
      tarifaFormatada: tarifa.toFixed(2)
    };
  });

  // Agrupa tarifas por Torre (média ponderada caso haja 2 medidores por torre)
  const torresMap: Record<string, { totalRs: number; totalM3: number }> = {};
  medidoresDetalhados.forEach(m => {
    if (!torresMap[m.torre]) torresMap[m.torre] = { totalRs: 0, totalM3: 0 };
    torresMap[m.torre].totalRs += m.valorRs * fatorLiquido;
    torresMap[m.torre].totalM3 += m.volumeM3;
  });

  const tarifasPorTorre: Record<string, number> = {};
  Object.keys(torresMap).forEach(torre => {
    const t = torresMap[torre];
    tarifasPorTorre[torre] = t.totalM3 > 0 ? Number((t.totalRs / t.totalM3).toFixed(4)) : tarifaMedia;
  });

  return {
    totalBrutoRs: Number(totalBrutoRs.toFixed(2)),
    manutencaoExpurgadaRs: Number(manutencaoLimpa.toFixed(2)),
    totalLiquidoRs: Number(totalLiquidoRs.toFixed(2)),
    totalM3,
    tarifa: Number(tarifaMedia.toFixed(4)),
    tarifaFormatada: tarifaMedia.toFixed(2),
    tarifasPorTorre,
    medidoresDetalhados
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
 * Extrai campo de um objeto de linha com suporte a múltiplos aliases case-insensitive
 */
export function extrairCampoLinha(row: Record<string, unknown>, possiveisChaves: string[]): unknown {
  for (const chave of possiveisChaves) {
    if (row[chave] !== undefined && row[chave] !== null && row[chave] !== '') {
      return row[chave];
    }
    const matchChave = Object.keys(row).find(
      k => k.trim().toLowerCase() === chave.toLowerCase()
    );
    if (matchChave && row[matchChave] !== undefined && row[matchChave] !== null && row[matchChave] !== '') {
      return row[matchChave];
    }
  }
  return undefined;
}

/**
 * Parser específico para abas brutas do ContaJusta ("ContaJusta Condominium_SABESP" / "ContaJusta Condominium_Gas").
 * Localiza a seção "Detalhes Apto." e combina "Nome do Edifício" + "Código Apto." em "Torre X-APTOYYYY".
 */
export function extrairLinhasContaJusta(worksheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const matriz: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!matriz || matriz.length === 0) return [];

  let headerIdx = -1;
  for (let i = 0; i < Math.min(60, matriz.length); i++) {
    const row = matriz[i];
    if (!Array.isArray(row)) continue;
    const joined = row.map(c => String(c || '').toLowerCase()).join('|');
    if (joined.includes('código apto') || joined.includes('codigo apto')) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return [];

  const headerRow = matriz[headerIdx].map(c => String(c || '').trim().toLowerCase());
  const colEdificio = headerRow.findIndex(h => h.includes('edifício') || h.includes('edificio'));
  const colApto = headerRow.findIndex(h => h.includes('código apto') || h.includes('codigo apto'));
  const colConsumo = headerRow.findIndex(h => h === 'consumo');
  const colValor = headerRow.findIndex(h => h.includes('valor consumido') || h.includes('valor'));

  if (colEdificio === -1 || colApto === -1) return [];

  const linhas: Record<string, unknown>[] = [];
  for (let r = headerIdx + 1; r < matriz.length; r++) {
    const row = matriz[r];
    if (!Array.isArray(row)) continue;
    const edificio = String(row[colEdificio] || '').trim();
    const apto = String(row[colApto] || '').trim();
    if (!edificio || !apto) continue;
    // Ignora linhas de resumo/rodapé
    if (!/torre|bloco/i.test(edificio)) continue;

    const aptoPadded = /^\d+$/.test(apto) ? apto.padStart(4, '0') : apto;
    linhas.push({
      'Nome Medidor': `${edificio}-APTO${aptoPadded}`,
      'Consumo': colConsumo !== -1 ? row[colConsumo] : 0,
      'Valor Total': colValor !== -1 ? row[colValor] : 0,
    });
  }

  return linhas;
}

/**
 * Parser Universal de Abas do Excel.
 * Detecta dinamicamente a linha de cabeçalho mesmo que haja títulos nas linhas 1 a 40.
 */
export function extrairLinhasUniversal(worksheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const matriz: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!matriz || matriz.length === 0) return [];

  // Se for uma aba bruta do ContaJusta, usa o extrator específico
  const ehContaJustaBruto = matriz.slice(0, 45).some(row =>
    Array.isArray(row) && row.some(c => {
      const s = String(c || '').toLowerCase();
      return s.includes('detalhes apto') || s.includes('código apto') || s.includes('codigo apto');
    })
  );
  if (ehContaJustaBruto) {
    const linhasCJ = extrairLinhasContaJusta(worksheet);
    if (linhasCJ.length > 0) return linhasCJ;
  }

  // Palavras-chave típicas de cabeçalho
  const palavrasChave = [
    'unidade', 'medidor', 'apto', 'apartamento', 'bloco', 'nome medidor',
    'consumo', 'valor', 'leitura', 'anterior', 'atual', 'total', 'código', 'conta', 'volume', 'torre'
  ];

  let linhaCabecalhoIdx = -1;
  let melhorContagem = 0;

  for (let i = 0; i < Math.min(40, matriz.length); i++) {
    const linha = matriz[i];
    if (!Array.isArray(linha)) continue;

    let contagem = 0;
    linha.forEach(celula => {
      const texto = String(celula || '').toLowerCase().trim();
      if (palavrasChave.some(pc => texto.includes(pc))) {
        contagem++;
      }
    });

    if (contagem > melhorContagem) {
      melhorContagem = contagem;
      linhaCabecalhoIdx = i;
    }
  }

  if (linhaCabecalhoIdx === -1 || melhorContagem < 1) {
    linhaCabecalhoIdx = 0;
  }

  const cabecalhos = (matriz[linhaCabecalhoIdx] || []).map((c, idx) => {
    const str = String(c || '').trim();
    return str || `COLUNA_${idx + 1}`;
  });

  const linhasObjetos: Record<string, unknown>[] = [];
  for (let r = linhaCabecalhoIdx + 1; r < matriz.length; r++) {
    const linha = matriz[r];
    if (!Array.isArray(linha) || linha.every(c => c === '' || c === null || c === undefined)) {
      continue;
    }

    const obj: Record<string, unknown> = {};
    cabecalhos.forEach((header, colIdx) => {
      if (header) {
        obj[header] = linha[colIdx] !== undefined ? linha[colIdx] : '';
      }
    });

    linhasObjetos.push(obj);
  }

  return linhasObjetos;
}

/**
 * Extrai dados de uma fatura PDF da Comgás a partir do texto extraído.
 * Identifica código de usuário (30xxxxxx), bloco/medidor, valor total (R$) e consumo faturado (m³).
 */
export function extrairContaComgasDeTextoPdf(
  texto: string,
  nomeArquivo: string
): ContaComgasMedidor & { leituraAnterior?: number; leituraAtual?: number } {
  const textoLimpo = texto.replace(/\s+/g, ' ').trim();

  // 1. Código do usuário / conta contrato (ex: 30267218)
  let codigoConta = '';
  for (const cod of Object.keys(MEDIDORES_COMGAS_ACQUAPLAY)) {
    if (textoLimpo.includes(cod) || nomeArquivo.includes(cod)) {
      codigoConta = cod;
      break;
    }
  }
  if (!codigoConta) {
    const matchCod = textoLimpo.match(/(?:c[oó]digo\s*(?:do\s*)?usu[aá]rio|instala[cç][aã]o|conta\s*contrato)[:\s]*([0-9]{7,10})/i)
      || textoLimpo.match(/\b(30\d{6})\b/);
    codigoConta = matchCod ? matchCod[1] : nomeArquivo.replace(/\.pdf$/i, '');
  }

  // 2. Bloco / Medidor
  let blocoMedidor = MEDIDORES_COMGAS_ACQUAPLAY[codigoConta] || '';
  if (!blocoMedidor) {
    const matchBloco = textoLimpo.match(/(?:BLOCO|TORRE)\s*([A-H])\s*[-–]?\s*(?:MEDIDOR\s*([12]))?/i);
    if (matchBloco) {
      blocoMedidor = `BLOCO ${matchBloco[1].toUpperCase()}${matchBloco[2] ? ` - MEDIDOR ${matchBloco[2]}` : ''}`;
    } else {
      blocoMedidor = `Medidor ${codigoConta}`;
    }
  }

  // 3. Valor Total da Fatura em R$
  let valorRs = 0;
  const regexValores = [
    /(?:total\s*a\s*pagar|valor\s*a\s*pagar|valor\s*do\s*documento|total\s*da\s*fatura|valor\s*total)\s*[:\s]*R?\$?\s*([\d.]+,\d{2})/i,
    /R\$\s*([\d.]+,\d{2})/g
  ];
  const mValorPrincipal = textoLimpo.match(regexValores[0]);
  if (mValorPrincipal) {
    valorRs = parseNumeroBR(mValorPrincipal[1]);
  } else {
    const todosValores = Array.from(textoLimpo.matchAll(/R\$\s*([\d.]+,\d{2})/g)).map(m => parseNumeroBR(m[1]));
    if (todosValores.length > 0) {
      valorRs = Math.max(...todosValores);
    }
  }

  // 4. Consumo faturado em m³
  let volumeM3 = 0;
  const regexConsumo = [
    /(?:consumo\s*faturado|volume\s*faturado|consumo\s*medido|consumo\s*\(?m[³3]\)?|total\s*faturado)\s*[:\s]*([\d.,]+)\s*m?[³3]?/i,
    /([\d.,]+)\s*m[³3]\b/i
  ];
  for (const rx of regexConsumo) {
    const m = textoLimpo.match(rx);
    if (m) {
      const val = parseNumeroBR(m[1]);
      if (val > 0) {
        volumeM3 = val;
        break;
      }
    }
  }

  return {
    codigoConta,
    blocoMedidor,
    valorRs,
    volumeM3,
  };
}

/**
 * 6. Gerador do Relatório Oficial para o Sérgio (Word / WhatsApp)
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
