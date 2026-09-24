// app/api/conciliar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { conciliarComSergio, parseNumeroBR, ItemConciliacao } from '@/lib/acquaPlayEngine';

interface SpreadsheetRow {
  [key: string]: unknown;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function extrairCampo(row: SpreadsheetRow, possiveisChaves: string[]): unknown {
  for (const chave of possiveisChaves) {
    if (row[chave] !== undefined && row[chave] !== null && row[chave] !== '') {
      return row[chave];
    }
    // Busca case-insensitive
    const matchChave = Object.keys(row).find(
      k => k.trim().toLowerCase() === chave.toLowerCase()
    );
    if (matchChave && row[matchChave] !== undefined && row[matchChave] !== null && row[matchChave] !== '') {
      return row[matchChave];
    }
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('fileSergio');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Nenhum ficheiro válido enviado sob a chave "fileSergio".' },
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

    const sheetName = wb.SheetNames.includes('Desmembrada')
      ? 'Desmembrada'
      : wb.SheetNames[0];

    const worksheet = wb.Sheets[sheetName];
    if (!worksheet) {
      return NextResponse.json(
        { error: `Não foi possível acessar a aba "${sheetName}" da planilha.` },
        { status: 400 }
      );
    }

    const rows = XLSX.utils.sheet_to_json<SpreadsheetRow>(worksheet, { defval: '' });

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'A aba selecionada está vazia ou sem cabeçalhos reconhecíveis.' },
        { status: 400 }
      );
    }

    const resultadoConciliacao: ItemConciliacao[] = [];
    const divergencias: ItemConciliacao[] = [];

    for (const row of rows) {
      const unidadeRaw = extrairCampo(row, [
        'Nome Medidor',
        'Unidade',
        'Medidor',
        'Apartamento',
        'Apto',
        'Identificador'
      ]);

      if (!unidadeRaw) continue;

      const unidade = String(unidadeRaw).trim();

      const consumoRaw = extrairCampo(row, [
        'Consumo',
        'Consumo (m³)',
        'Consumo m3',
        'Volume',
        'm3',
        'Consumo Sabesp'
      ]);

      const valorSergioRaw = extrairCampo(row, [
        'Valor',
        'Valor (R$)',
        'Total',
        'Valor Sergio',
        'Valor Sérgio',
        'Valor Cobrado'
      ]);

      const consumo = parseNumeroBR(consumoRaw);
      const valorSergio = parseNumeroBR(valorSergioRaw);

      const audit = conciliarComSergio(unidade, consumo, valorSergio);
      const item: ItemConciliacao = {
        unidade,
        consumo,
        ...audit
      };

      resultadoConciliacao.push(item);

      if (audit.status === 'FALSO') {
        divergencias.push(item);
      }
    }

    const total = resultadoConciliacao.length;
    const aprovados = total - divergencias.length;

    return NextResponse.json({
      success: true,
      total,
      aprovados,
      divergenciasCount: divergencias.length,
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