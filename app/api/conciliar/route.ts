// app/api/conciliar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import {
  extrairLinhasUniversal,
  extrairCampoLinha,
  parseNumeroBR,
  extrairTorre,
  conciliarComSergio,
  ItemConciliacao
} from '@/lib/acquaPlayEngine';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('fileSergio') || formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Nenhum ficheiro válido enviado sob a chave "fileSergio" ou "file".' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `O ficheiro excede o limite máximo permitido de ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 413 }
      );
    }

    const extensao = file.name.split('.').pop()?.toLowerCase();
    if (!extensao || !['xlsx', 'xls', 'csv', 'ods'].includes(extensao)) {
      return NextResponse.json(
        { error: 'Formato de ficheiro inválido. Por favor envie uma planilha (.xlsx, .xls ou .csv).' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });

    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return NextResponse.json(
        { error: 'A planilha fornecida não contém abas legíveis.' },
        { status: 400 }
      );
    }

    // Busca inteligente em todas as abas
    let sheetName = wb.SheetNames[0];
    let rows: Record<string, unknown>[] = [];

    const prioridades = ['desmembrada', 'medição', 'medicao', 'água', 'agua', 'folha', 'sergio'];
    const abasOrdenadas = [...wb.SheetNames].sort((a, b) => {
      const aMatch = prioridades.some(p => a.toLowerCase().includes(p)) ? 1 : 0;
      const bMatch = prioridades.some(p => b.toLowerCase().includes(p)) ? 1 : 0;
      return bMatch - aMatch;
    });

    for (const sName of abasOrdenadas) {
      const worksheet = wb.Sheets[sName];
      if (!worksheet) continue;
      const linhas = extrairLinhasUniversal(worksheet);
      if (linhas.length > rows.length) {
        rows = linhas;
        sheetName = sName;
      }
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'A aba selecionada está vazia ou sem cabeçalhos reconhecíveis.' },
        { status: 400 }
      );
    }

    const resultadoConciliacao: ItemConciliacao[] = [];
    const divergencias: ItemConciliacao[] = [];
    const negativos: ItemConciliacao[] = [];

    for (const row of rows) {
      const unidadeRaw = extrairCampoLinha(row, [
        'Nome Medidor',
        'Unidade',
        'Medidor',
        'Apartamento',
        'Apto',
        'Identificador',
        'Apt'
      ]);

      if (!unidadeRaw) continue;

      const unidade = String(unidadeRaw).trim();

      const consumoRaw = extrairCampoLinha(row, [
        'Consumo',
        'Consumo (m³)',
        'Consumo m3',
        'Volume',
        'm3',
        'Consumo Sabesp',
        'M3'
      ]);

      const valorSergioRaw = extrairCampoLinha(row, [
        'Valor',
        'Valor (R$)',
        'Total',
        'Valor Sergio',
        'Valor Sérgio',
        'Valor Cobrado'
      ]);

      const leituraAnteriorRaw = extrairCampoLinha(row, [
        'Leitura Anterior',
        'Leit Anterior',
        'Leitura Ant',
        'Ant',
        'Anterior'
      ]);

      const leituraAtualRaw = extrairCampoLinha(row, [
        'Leitura Atual',
        'Leit Atual',
        'Atual'
      ]);

      const consumoGasRaw = extrairCampoLinha(row, [
        'Consumo Gás',
        'Consumo Gas',
        'Gás (m³)',
        'Gas m3'
      ]);

      const valorSergioGasRaw = extrairCampoLinha(row, [
        'Valor Gás',
        'Valor Gas',
        'Gás (R$)',
        'Gas R$'
      ]);

      const consumo = parseNumeroBR(consumoRaw);
      const valorSergio = parseNumeroBR(valorSergioRaw);
      const leituraAnterior = leituraAnteriorRaw !== undefined ? parseNumeroBR(leituraAnteriorRaw) : undefined;
      const leituraAtual = leituraAtualRaw !== undefined ? parseNumeroBR(leituraAtualRaw) : undefined;
      const consumoGas = consumoGasRaw !== undefined ? parseNumeroBR(consumoGasRaw) : undefined;
      const valorSergioGas = valorSergioGasRaw !== undefined ? parseNumeroBR(valorSergioGasRaw) : undefined;

      const audit = conciliarComSergio(unidade, consumo, valorSergio, leituraAnterior, leituraAtual);
      const torre = extrairTorre(unidade);

      const item: ItemConciliacao = {
        unidade,
        torre,
        consumo,
        leituraAnterior,
        leituraAtual,
        ...audit,
        consumoGas,
        valorGasSergio: valorSergioGas,
        statusGas: valorSergioGas === 0 ? 'SERGIO_ZERADO' : undefined
      };

      resultadoConciliacao.push(item);

      if (audit.status === 'FALSO') {
        divergencias.push(item);
      }

      if (item.tipoAnomalia === 'NEGATIVO' || consumo < 0) {
        negativos.push(item);
      }
    }

    const total = resultadoConciliacao.length;
    const aprovados = total - divergencias.length;

    return NextResponse.json({
      success: true,
      total,
      aprovados,
      divergenciasCount: divergencias.length,
      negativosCount: negativos.length,
      divergencias,
      detalhes: resultadoConciliacao,
      abaProcessada: sheetName,
      nomeArquivo: file.name
    });
  } catch (err: unknown) {
    const mensagem = err instanceof Error ? err.message : 'Erro interno ao processar planilha.';
    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
