// app/api/processar-planilha/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import {
  extrairLinhasUniversal,
  extrairCampoLinha,
  parseNumeroBR,
  extrairTorre,
  calcularValorSabesp,
  calcularTarifaComgas,
  conciliarComSergio,
  classificarConsumo,
  ItemConciliacao,
  MedicaoIndividual,
  ContaComgasMedidor
} from '@/lib/acquaPlayEngine';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const tipo = (formData.get('tipo') || 'sergio') as 'agua' | 'gas_individual' | 'comgas' | 'sergio';
    const tarifasPorTorreRaw = formData.get('tarifasPorTorre');
    const manutencaoGasRaw = formData.get('manutencaoGas');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado. Por favor selecione uma planilha (.xlsx, .xls ou .csv).' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `O arquivo excede o limite máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 413 }
      );
    }

    const extensao = file.name.split('.').pop()?.toLowerCase();
    if (!extensao || !['xlsx', 'xls', 'csv', 'ods'].includes(extensao)) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie uma planilha Excel (.xlsx, .xls) ou CSV.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return NextResponse.json(
        { error: 'A planilha enviada não contém abas legíveis.' },
        { status: 400 }
      );
    }

    let tarifasPorTorre: Record<string, number> = {};
    if (typeof tarifasPorTorreRaw === 'string') {
      try {
        tarifasPorTorre = JSON.parse(tarifasPorTorreRaw);
      } catch {
        tarifasPorTorre = {};
      }
    }

    const manutencaoGas = parseNumeroBR(manutencaoGasRaw);

    // Encontra a melhor aba que contenha linhas úteis
    let melhorSheetName = wb.SheetNames[0];
    let linhasExtraidas: Record<string, unknown>[] = [];

    // Prioridade para abas com nomes conhecidos se existirem
    const prioridades = ['desmembrada', 'medição', 'medicao', 'água', 'agua', 'gás', 'gas', 'comgás', 'comgas', 'hidrometros', 'gasometros'];
    const abasOrdenadas = [...wb.SheetNames].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aMatch = prioridades.some(p => aLower.includes(p)) ? 1 : 0;
      const bMatch = prioridades.some(p => bLower.includes(p)) ? 1 : 0;
      return bMatch - aMatch;
    });

    for (const sName of abasOrdenadas) {
      const ws = wb.Sheets[sName];
      if (!ws) continue;
      const linhas = extrairLinhasUniversal(ws);
      if (linhas.length > linhasExtraidas.length) {
        linhasExtraidas = linhas;
        melhorSheetName = sName;
      }
    }

    if (linhasExtraidas.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível encontrar dados legíveis nas abas da planilha. Verifique se o arquivo não está corrompido.' },
        { status: 400 }
      );
    }

    // 1. Processar Planilha de Água Individual
    if (tipo === 'agua') {
      const itensAgua: MedicaoIndividual[] = [];

      for (const row of linhasExtraidas) {
        const unidadeRaw = extrairCampoLinha(row, [
          'Unidade', 'Nome Medidor', 'Medidor', 'Apartamento', 'Apto', 'Identificador', 'Apt'
        ]);
        if (!unidadeRaw) continue;
        const unidade = String(unidadeRaw).trim();

        const leituraAnteriorRaw = extrairCampoLinha(row, ['Leitura Anterior', 'Leit Anterior', 'Leitura Ant', 'Ant', 'Anterior']);
        const leituraAtualRaw = extrairCampoLinha(row, ['Leitura Atual', 'Leit Atual', 'Atual', 'Leitura']);
        const consumoRaw = extrairCampoLinha(row, ['Consumo', 'Consumo (m³)', 'Consumo m3', 'Volume', 'm3', 'Consumo Sabesp', 'M3']);

        const leituraAnterior = leituraAnteriorRaw !== undefined ? parseNumeroBR(leituraAnteriorRaw) : undefined;
        const leituraAtual = leituraAtualRaw !== undefined ? parseNumeroBR(leituraAtualRaw) : undefined;

        let consumo = parseNumeroBR(consumoRaw);
        if (consumoRaw === undefined && leituraAnterior !== undefined && leituraAtual !== undefined) {
          consumo = Number((leituraAtual - leituraAnterior).toFixed(2));
        }

        const torre = extrairTorre(unidade);
        const anomalia = classificarConsumo(consumo);
        const valorCalculado = calcularValorSabesp(consumo);

        let observacao = anomalia.descricao;
        if (leituraAnterior !== undefined && leituraAtual !== undefined && leituraAtual < leituraAnterior) {
          observacao = `⚠️ Troca física de hidrômetro/cyble: Leitura atual (${leituraAtual}) < Leitura anterior (${leituraAnterior}). Requer retroativo.`;
        }

        itensAgua.push({
          unidade,
          torre,
          leituraAnterior,
          leituraAtual,
          consumo,
          valorCalculado,
          tipoAnomalia: anomalia.tipo,
          observacao
        });
      }

      return NextResponse.json({
        success: true,
        tipo: 'agua',
        total: itensAgua.length,
        itens: itensAgua,
        abaProcessada: melhorSheetName,
        nomeArquivo: file.name
      });
    }

    // 2. Processar Planilha de Gás Individual
    if (tipo === 'gas_individual') {
      const itensGas: MedicaoIndividual[] = [];

      for (const row of linhasExtraidas) {
        const unidadeRaw = extrairCampoLinha(row, [
          'Unidade', 'Nome Medidor', 'Medidor', 'Apartamento', 'Apto', 'Identificador', 'Apt'
        ]);
        if (!unidadeRaw) continue;
        const unidade = String(unidadeRaw).trim();

        const leituraAnteriorRaw = extrairCampoLinha(row, ['Leitura Anterior', 'Leit Anterior', 'Leitura Ant', 'Ant', 'Anterior']);
        const leituraAtualRaw = extrairCampoLinha(row, ['Leitura Atual', 'Leit Atual', 'Atual', 'Leitura']);
        const consumoRaw = extrairCampoLinha(row, ['Consumo', 'Consumo (m³)', 'Consumo m3', 'Volume', 'm3', 'Consumo Gas', 'Consumo Gás', 'M3']);

        const leituraAnterior = leituraAnteriorRaw !== undefined ? parseNumeroBR(leituraAnteriorRaw) : undefined;
        const leituraAtual = leituraAtualRaw !== undefined ? parseNumeroBR(leituraAtualRaw) : undefined;

        let consumo = parseNumeroBR(consumoRaw);
        if (consumoRaw === undefined && leituraAnterior !== undefined && leituraAtual !== undefined) {
          consumo = Number((leituraAtual - leituraAnterior).toFixed(2));
        }

        const torre = extrairTorre(unidade);
        const tarifaTorre = tarifasPorTorre[torre] || 5.48; // Fallback se não calculado ainda
        const valorCalculado = Number((consumo * tarifaTorre).toFixed(2));
        const anomalia = classificarConsumo(consumo, 20);

        let observacao = anomalia.descricao;
        if (leituraAnterior !== undefined && leituraAtual !== undefined && leituraAtual < leituraAnterior) {
          observacao = `⚠️ Troca física de gasômetro: Leitura atual (${leituraAtual}) < Leitura anterior (${leituraAnterior}). Requer retroativo.`;
        }

        itensGas.push({
          unidade,
          torre,
          leituraAnterior,
          leituraAtual,
          consumo,
          valorCalculado,
          tipoAnomalia: anomalia.tipo,
          observacao
        });
      }

      return NextResponse.json({
        success: true,
        tipo: 'gas_individual',
        total: itensGas.length,
        itens: itensGas,
        abaProcessada: melhorSheetName,
        nomeArquivo: file.name
      });
    }

    // 3. Processar Contas Comgás dos 16 Medidores Mestres (1º andar)
    if (tipo === 'comgas') {
      const contas: ContaComgasMedidor[] = [];

      for (const row of linhasExtraidas) {
        const blocoRaw = extrairCampoLinha(row, [
          'Bloco', 'Torre', 'Medidor', 'Descrição', 'Descricao', 'Identificação', 'Nome', 'Unidade'
        ]);
        const codigoRaw = extrairCampoLinha(row, [
          'Código', 'Codigo', 'Conta', 'Conta Contrato', 'Instalação', 'Instalacao', 'Nº', 'Contrato'
        ]);
        const valorRaw = extrairCampoLinha(row, [
          'Valor', 'Valor (R$)', 'Total', 'Valor Total', 'R$', 'Valor Fatura'
        ]);
        const volumeRaw = extrairCampoLinha(row, [
          'Volume', 'Volume (m³)', 'Volume m3', 'Consumo', 'm3', 'Faturado', 'Volume Faturado'
        ]);

        if (!blocoRaw && !codigoRaw && !valorRaw) continue;

        const valorRs = parseNumeroBR(valorRaw);
        const volumeM3 = parseNumeroBR(volumeRaw);
        const bloco = String(blocoRaw || `Medidor ${contas.length + 1}`).trim();
        const codigoConta = String(codigoRaw || `3046${1400 + contas.length}`).trim();

        contas.push({
          codigoConta,
          blocoMedidor: bloco,
          valorRs,
          volumeM3
        });
      }

      if (contas.length === 0) {
        return NextResponse.json(
          { error: 'Não foi possível identificar colunas de medidor, valor ou volume na planilha da Comgás.' },
          { status: 400 }
        );
      }

      const resultadoGas = calcularTarifaComgas(contas, manutencaoGas);

      return NextResponse.json({
        success: true,
        tipo: 'comgas',
        contas,
        resultadoGas,
        abaProcessada: melhorSheetName,
        nomeArquivo: file.name
      });
    }

    // 4. Processar Folha do Sérgio (Conta Justa / Sabesp / Gás)
    // tipo === 'sergio'
    const resultadoConciliacao: ItemConciliacao[] = [];
    const divergencias: ItemConciliacao[] = [];
    const negativos: ItemConciliacao[] = [];
    let contadorGasZerado = 0;

    for (const row of linhasExtraidas) {
      const unidadeRaw = extrairCampoLinha(row, [
        'Nome Medidor', 'Unidade', 'Medidor', 'Apartamento', 'Apto', 'Identificador', 'Apt'
      ]);
      if (!unidadeRaw) continue;
      const unidade = String(unidadeRaw).trim();

      const consumoAguaRaw = extrairCampoLinha(row, [
        'Consumo', 'Consumo (m³)', 'Consumo m3', 'Volume', 'm3', 'Consumo Sabesp', 'Consumo Água', 'Consumo Agua'
      ]);
      const valorSergioAguaRaw = extrairCampoLinha(row, [
        'Valor', 'Valor (R$)', 'Total', 'Valor Sergio', 'Valor Sérgio', 'Valor Cobrado', 'Valor Água', 'Valor Sabesp'
      ]);

      const leituraAnteriorRaw = extrairCampoLinha(row, ['Leitura Anterior', 'Leit Anterior', 'Leitura Ant', 'Ant', 'Anterior']);
      const leituraAtualRaw = extrairCampoLinha(row, ['Leitura Atual', 'Leit Atual', 'Atual']);

      const consumoGasRaw = extrairCampoLinha(row, [
        'Consumo Gás', 'Consumo Gas', 'Gás (m³)', 'Gas (m3)', 'Volume Gas', 'm3 Gas'
      ]);
      const valorSergioGasRaw = extrairCampoLinha(row, [
        'Valor Gás', 'Valor Gas', 'Gás (R$)', 'Gas (R$)', 'Total Gas', 'Tarifa Gas'
      ]);

      const consumoAgua = parseNumeroBR(consumoAguaRaw);
      const valorSergioAgua = parseNumeroBR(valorSergioAguaRaw);
      const leituraAnterior = leituraAnteriorRaw !== undefined ? parseNumeroBR(leituraAnteriorRaw) : undefined;
      const leituraAtual = leituraAtualRaw !== undefined ? parseNumeroBR(leituraAtualRaw) : undefined;

      const consumoGas = consumoGasRaw !== undefined ? parseNumeroBR(consumoGasRaw) : undefined;
      const valorSergioGas = valorSergioGasRaw !== undefined ? parseNumeroBR(valorSergioGasRaw) : 0;

      const torre = extrairTorre(unidade);
      const tarifaTorre = tarifasPorTorre[torre] || 5.48;
      const valorGasCalculado = consumoGas !== undefined ? Number((consumoGas * tarifaTorre).toFixed(2)) : undefined;

      // Status do Gás: Se Sérgio veio com 0 ou sem valor mas há consumo, é 'SERGIO_ZERADO'
      let statusGas: 'VERDADEIRO' | 'FALSO' | 'SERGIO_ZERADO' | undefined = undefined;
      if (consumoGas !== undefined && consumoGas > 0) {
        if (valorSergioGas === 0) {
          statusGas = 'SERGIO_ZERADO';
          contadorGasZerado++;
        } else if (valorGasCalculado !== undefined) {
          const diffGas = Math.abs(valorGasCalculado - valorSergioGas);
          statusGas = diffGas <= 0.05 ? 'VERDADEIRO' : 'FALSO';
        }
      }

      const auditAgua = conciliarComSergio(unidade, consumoAgua, valorSergioAgua, leituraAnterior, leituraAtual);

      const item: ItemConciliacao = {
        unidade,
        torre,
        consumo: consumoAgua,
        valorHydrojexe: auditAgua.valorHydrojexe,
        valorSergio: auditAgua.valorSergio,
        status: auditAgua.status,
        diferenca: auditAgua.diferenca,
        diferencaAbs: auditAgua.diferencaAbs,
        leituraAnterior,
        leituraAtual,
        tipoAnomalia: auditAgua.tipoAnomalia,
        observacao: auditAgua.observacao,

        // Gás individual
        consumoGas,
        tarifaGasTorre: tarifaTorre,
        valorGasHydrojexe: valorGasCalculado,
        valorGasSergio: valorSergioGas,
        statusGas,

        // Total consolidado
        valorTotalHydrojexe: Number((auditAgua.valorHydrojexe + (valorGasCalculado || 0)).toFixed(2)),
        valorTotalSergio: Number((valorSergioAgua + valorSergioGas).toFixed(2))
      };

      resultadoConciliacao.push(item);

      if (auditAgua.status === 'FALSO') {
        divergencias.push(item);
      }

      if (auditAgua.tipoAnomalia === 'NEGATIVO' || consumoAgua < 0) {
        negativos.push(item);
      }
    }

    const total = resultadoConciliacao.length;
    const aprovados = total - divergencias.length;

    return NextResponse.json({
      success: true,
      tipo: 'sergio',
      total,
      aprovados,
      divergenciasCount: divergencias.length,
      negativosCount: negativos.length,
      contadorGasZerado,
      divergencias,
      detalhes: resultadoConciliacao,
      abaProcessada: melhorSheetName,
      nomeArquivo: file.name
    });

  } catch (err: unknown) {
    const mensagem = err instanceof Error ? err.message : 'Erro interno ao processar a planilha.';
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
