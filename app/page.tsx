// app/page.tsx
'use client';

import React, { useState, useMemo, useId } from 'react';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  FileSpreadsheet, 
  Search,
  Download,
  Loader2,
  RefreshCw,
  Check
} from 'lucide-react';
import { 
  formatarMoedaBRL, 
  formatarM3, 
  calcularTarifaComgas, 
  ItemConciliacao 
} from '@/lib/acquaPlayEngine';

interface ContaComgasUI {
  codigo: string;
  bloco: string;
  valorRs: number;
  volumeM3: number;
}

interface AuditoriaItem {
  id: string;
  unidade: string;
  consumoAgua: number;
  consumoGas: number;
  motivo: string;
  confirmado: boolean;
  observacao: string;
}

const CONTAS_COMGAS_INICIAIS: ContaComgasUI[] = [
  { codigo: '30267218', bloco: 'TORRE A - MEDIDOR 1', valorRs: 8777.07, volumeM3: 1600 },
  { codigo: '30461499', bloco: 'TORRE A - MEDIDOR 2', valorRs: 10214.32, volumeM3: 1862 },
  { codigo: '30446422', bloco: 'TORRE B - MEDIDOR 1', valorRs: 4372.08, volumeM3: 797 },
  { codigo: '30461286', bloco: 'TORRE B - MEDIDOR 2', valorRs: 11081.05, volumeM3: 2020 },
  { codigo: '30461500', bloco: 'TORRE C - MEDIDOR 1', valorRs: 9150.20, volumeM3: 1670 },
  { codigo: '30461501', bloco: 'TORRE C - MEDIDOR 2', valorRs: 8420.15, volumeM3: 1535 },
  { codigo: '30461502', bloco: 'TORRE D - MEDIDOR 1', valorRs: 7890.40, volumeM3: 1440 },
  { codigo: '30461503', bloco: 'TORRE D - MEDIDOR 2', valorRs: 9640.80, volumeM3: 1760 },
  { codigo: '30461504', bloco: 'TORRE E - MEDIDOR 1', valorRs: 8320.10, volumeM3: 1520 },
  { codigo: '30461505', bloco: 'TORRE E - MEDIDOR 2', valorRs: 7950.60, volumeM3: 1450 },
  { codigo: '30461506', bloco: 'TORRE F - MEDIDOR 1', valorRs: 8900.00, volumeM3: 1625 },
  { codigo: '30461507', bloco: 'TORRE F - MEDIDOR 2', valorRs: 9120.30, volumeM3: 1665 },
  { codigo: '30461508', bloco: 'TORRE G - MEDIDOR 1', valorRs: 8450.50, volumeM3: 1540 },
  { codigo: '30461509', bloco: 'TORRE G - MEDIDOR 2', valorRs: 7780.25, volumeM3: 1420 },
  { codigo: '30461510', bloco: 'TORRE H - MEDIDOR 1', valorRs: 8650.90, volumeM3: 1580 },
  { codigo: '30461511', bloco: 'TORRE H - MEDIDOR 2', valorRs: 9230.10, volumeM3: 1685 },
];

const CASOS_AUDITORIA_INICIAIS: AuditoriaItem[] = [
  {
    id: '1',
    unidade: 'Torre A - APTO 0048',
    consumoAgua: 40.18,
    consumoGas: 0.0,
    motivo: '⚠️ Meses anteriores zerados e consumo atual de 40.18 m³ (Cyble trocado 20/08/26; Consumo retroativo)',
    confirmado: false,
    observacao: 'Consumo acumulado pós-manutenção do medidor de água.'
  },
  {
    id: '2',
    unidade: 'Torre B - APTO 0112',
    consumoAgua: 28.50,
    consumoGas: 1.20,
    motivo: 'Disparidade 3:1 acentuada (Água 28.5m³ vs Gás 1.2m³)',
    confirmado: false,
    observacao: 'Suspeita de medidor de gás parado ou com vazamento de água.'
  },
  {
    id: '3',
    unidade: 'Torre D - APTO 0083',
    consumoAgua: 0.0,
    consumoGas: 18.40,
    motivo: 'Gás ativo porém água zerada (possível hidrômetro travado)',
    confirmado: false,
    observacao: 'Morador residindo no local, necessário vistoriar hidrômetro.'
  },
];

export default function AcquaPlayHub() {
  const [tab, setTab] = useState<'upload' | 'conciliacao' | 'gas' | 'auditoria'>('upload');
  const [contasComgas] = useState<ContaComgasUI[]>(CONTAS_COMGAS_INICIAIS);
  const [casosAuditoria, setCasosAuditoria] = useState<AuditoriaItem[]>(CASOS_AUDITORIA_INICIAIS);

  // Estados de upload e conciliação
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [dadosConciliacao, setDadosConciliacao] = useState<ItemConciliacao[]>([
    {
      unidade: 'Torre A-APTO0031',
      consumo: 12.84,
      valorHydrojexe: 113.16,
      valorSergio: 113.16,
      status: 'VERDADEIRO',
      diferenca: 0.0,
      diferencaAbs: 0.0
    },
    {
      unidade: 'Torre B-APTO0054',
      consumo: 22.10,
      valorHydrojexe: 226.26,
      valorSergio: 218.50,
      status: 'FALSO',
      diferenca: 7.76,
      diferencaAbs: 7.76
    }
  ]);
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'VERDADEIRO' | 'FALSO'>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState('');

  // IDs acessíveis para inputs
  const inputLeiturasId = useId();
  const inputSergioId = useId();

  // Cálculos consolidados da Comgás
  const dadosGas = useMemo(() => {
    return calcularTarifaComgas(
      contasComgas.map(c => ({
        codigoConta: c.codigo,
        blocoMedidor: c.bloco,
        valorRs: c.valorRs,
        volumeM3: c.volumeM3
      }))
    );
  }, [contasComgas]);

  // Contagens dinâmicas
  const totalUnidadesCadastradas = dadosConciliacao.length > 2 ? dadosConciliacao.length : 1435;
  const divergenciasReais = useMemo(() => {
    return dadosConciliacao.filter(item => item.status === 'FALSO').length;
  }, [dadosConciliacao]);

  const aprovadosReais = useMemo(() => {
    return dadosConciliacao.filter(item => item.status === 'VERDADEIRO').length;
  }, [dadosConciliacao]);

  // Lista filtrada da conciliação
  const listaConciliacaoFiltrada = useMemo(() => {
    return dadosConciliacao.filter(item => {
      const matchStatus = filtroStatus === 'TODOS' || item.status === filtroStatus;
      const matchBusca = buscaTexto === '' || item.unidade.toLowerCase().includes(buscaTexto.toLowerCase());
      return matchStatus && matchBusca;
    });
  }, [dadosConciliacao, filtroStatus, buscaTexto]);

  // Handler para processar planilha do Sérgio
  const handleUploadSergio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('fileSergio', file);

      const res = await fetch('/api/conciliar', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar planilha no servidor.');
      }

      setDadosConciliacao(data.detalhes || []);
      setUploadSuccessMessage(
        `Planilha "${file.name}" processada com sucesso! ${data.total} unidades lidas, ${data.aprovados} aprovadas e ${data.divergenciasCount} divergências identificadas.`
      );
      setTab('conciliacao');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na comunicação com o servidor.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Handler para exportação em Excel
  const handleExportarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Aba 1: Conciliação
      const dadosExportConciliacao = dadosConciliacao.map(item => ({
        'Unidade / Apartamento': item.unidade,
        'Consumo (m³)': item.consumo,
        'Valor Hydrojexe (R$)': item.valorHydrojexe,
        'Valor Sérgio (R$)': item.valorSergio,
        'Status Conciliação': item.status,
        'Diferença (R$)': item.diferenca
      }));
      const wsConciliacao = XLSX.utils.json_to_sheet(dadosExportConciliacao);
      XLSX.utils.book_append_sheet(wb, wsConciliacao, 'Conciliacao_Sabesp');

      // Aba 2: Comgás
      const dadosExportGas = contasComgas.map(c => ({
        'Bloco / Medidor': c.bloco,
        'Código Comgás': c.codigo,
        'Volume Faturado (m³)': c.volumeM3,
        'Valor da Fatura (R$)': c.valorRs,
        'Tarifa Unitária (R$/m³)': dadosGas.tarifaFormatada
      }));
      const wsGas = XLSX.utils.json_to_sheet(dadosExportGas);
      XLSX.utils.book_append_sheet(wb, wsGas, 'Medidores_Comgas');

      // Aba 3: Auditoria
      const dadosExportAuditoria = casosAuditoria.map(a => ({
        'Unidade': a.unidade,
        'Consumo Água (m³)': a.consumoAgua,
        'Consumo Gás (m³)': a.consumoGas,
        'Motivo / Alerta': a.motivo,
        'Status Confirmação': a.confirmado ? 'Confirmado' : 'Pendente',
        'Observações': a.observacao
      }));
      const wsAuditoria = XLSX.utils.json_to_sheet(dadosExportAuditoria);
      XLSX.utils.book_append_sheet(wb, wsAuditoria, 'Auditoria_Vistorias');

      const dataAtual = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `AcquaPlay_Extrato_Fechamento_${dataAtual}.xlsx`);
    } catch {
      alert('Falha ao gerar arquivo Excel para exportação.');
    }
  };

  // Alternar confirmação de retroativo
  const toggleConfirmarRetroativo = (id: string) => {
    setCasosAuditoria(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, confirmado: !item.confirmado };
      }
      return item;
    }));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Hydrojexe Individualizações
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            AcquaPlay Home &amp; Resort — Fechamento Mensal
          </h1>
          <p className="text-xs text-slate-400">Automação de Água (Sabesp) e Gás (Comgás) — 1.435 Unidades</p>
        </div>

        <button 
          type="button"
          onClick={handleExportarExcel}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm border border-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        >
          <Download className="w-4 h-4 text-blue-400" />
          Exportar Extrato Final (.xlsx)
        </button>
      </header>

      {/* Alertas Globais de Sucesso ou Erro */}
      {uploadError && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3" role="alert">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erro no processamento da planilha</p>
            <p className="text-xs text-rose-200/80 mt-0.5">{uploadError}</p>
          </div>
        </div>
      )}

      {uploadSuccessMessage && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start gap-3" role="status">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Operação concluída com sucesso</p>
            <p className="text-xs text-emerald-200/80 mt-0.5">{uploadSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Indicadores Globais */}
      <section aria-label="Indicadores Globais de Fechamento" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-400">Total de Unidades</span>
          <div className="text-2xl font-bold text-white mt-1">
            {totalUnidadesCadastradas.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Torres A até H (1.435 aptos)</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Tarifa Gás (Comgás)</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400 mt-1">
            R$ {dadosGas.tarifaFormatada} <span className="text-sm font-normal text-slate-400">/ m³</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Fatura Total: {formatarMoedaBRL(dadosGas.totalRs)} ({formatarM3(dadosGas.totalM3, 0)} m³)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Divergências Sérgio</span>
            {divergenciasReais > 0 ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className={`text-2xl font-bold mt-1 ${divergenciasReais > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {divergenciasReais}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {aprovadosReais} unidades com status VERDADEIRO
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Vistorias (Regra 3:1)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{casosAuditoria.length}</div>
          <p className="text-xs text-slate-400 mt-1">Disparidade ou Medidor Parado</p>
        </div>
      </section>

      {/* Navegação por Abas (WAI-ARIA) */}
      <nav role="tablist" aria-label="Abas do Sistema" className="flex border-b border-slate-800 mb-6 gap-2 overflow-x-auto">
        {(['upload', 'conciliacao', 'gas', 'auditoria'] as const).map(item => {
          const titulos = {
            upload: 'Upload & Leituras',
            conciliacao: `Conciliação Sabesp (${dadosConciliacao.length})`,
            gas: `Tarifa Gás Comgás (16 Medidores)`,
            auditoria: `Auditoria Cruzada (${casosAuditoria.length})`
          };

          const isSelected = tab === item;

          return (
            <button
              key={item}
              role="tab"
              type="button"
              aria-selected={isSelected}
              aria-controls={`panel-${item}`}
              id={`tab-${item}`}
              onClick={() => setTab(item)}
              className={`pb-3 px-4 text-sm font-medium transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t cursor-pointer ${
                isSelected 
                  ? 'text-blue-400 border-b-2 border-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {titulos[item]}
            </button>
          );
        })}
      </nav>

      {/* Conteúdo da Aba 1: Upload */}
      {tab === 'upload' && (
        <div id="panel-upload" role="tabpanel" aria-labelledby="tab-upload" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/40 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-900/40 text-center transition">
            <UploadCloud className="w-10 h-10 text-blue-400 mb-3" />
            <h2 className="font-semibold text-white text-base">Planilha de Leituras Mensais</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Carregue o arquivo com as medições atuais de água e gás do condomínio (Torres A a H).
            </p>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="sr-only" 
              id={inputLeiturasId} 
              disabled={isUploading}
            />
            <label 
              htmlFor={inputLeiturasId} 
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById(inputLeiturasId)?.click();
                }
              }}
              className="mt-5 bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium px-4 py-2.5 rounded-lg cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 inline-flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Selecionar Leituras (.xlsx)
            </label>
          </div>

          <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-900/40 text-center transition">
            <FileSpreadsheet className="w-10 h-10 text-emerald-400 mb-3" />
            <h2 className="font-semibold text-white text-base">Planilha do Sérgio (Conta Justa)</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Executa a conciliação automática com a tabela Sabesp 2026 e identifica divergências de centavos.
            </p>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              className="sr-only" 
              id={inputSergioId} 
              onChange={handleUploadSergio}
              disabled={isUploading}
            />
            <label 
              htmlFor={inputSergioId} 
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById(inputSergioId)?.click();
                }
              }}
              className="mt-5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium px-4 py-2.5 rounded-lg cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 inline-flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando Planilha...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Carregar e Conciliar Folha Sérgio
                </>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Conciliação */}
      {tab === 'conciliacao' && (
        <div id="panel-conciliacao" role="tabpanel" aria-labelledby="tab-conciliacao" className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Filtrar por unidade (ex: Torre A, 0031)..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              {(['TODOS', 'VERDADEIRO', 'FALSO'] as const).map(opcao => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setFiltroStatus(opcao)}
                  className={`text-xs px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                    filtroStatus === opcao 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opcao === 'TODOS' ? 'Todos' : opcao === 'VERDADEIRO' ? 'Aprovados' : 'Divergências'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-300 uppercase border-b border-slate-800 font-sans sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="p-3">Unidade</th>
                    <th scope="col" className="p-3 text-right">Consumo (m³)</th>
                    <th scope="col" className="p-3 text-right">Hydrojexe (Sabesp)</th>
                    <th scope="col" className="p-3 text-right">Folha Sérgio</th>
                    <th scope="col" className="p-3 text-right">Diferença</th>
                    <th scope="col" className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {listaConciliacaoFiltrada.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    listaConciliacaoFiltrada.map((item, idx) => {
                      const isFalso = item.status === 'FALSO';
                      return (
                        <tr key={`${item.unidade}-${idx}`} className={`hover:bg-slate-800/40 transition ${isFalso ? 'bg-rose-500/5' : ''}`}>
                          <td className="p-3 font-sans text-slate-200 font-medium">{item.unidade}</td>
                          <td className="p-3 text-right text-slate-300">{formatarM3(item.consumo)}</td>
                          <td className="p-3 text-right text-slate-300">{formatarMoedaBRL(item.valorHydrojexe)}</td>
                          <td className="p-3 text-right text-slate-300">{formatarMoedaBRL(item.valorSergio)}</td>
                          <td className={`p-3 text-right font-medium ${isFalso ? 'text-rose-400' : 'text-slate-400'}`}>
                            {item.diferenca === 0 ? '—' : `${item.diferenca > 0 ? '+' : ''}${formatarMoedaBRL(item.diferenca)}`}
                          </td>
                          <td className="p-3 text-center">
                            {isFalso ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <XCircle className="w-3 h-3" /> FALSO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> VERDADEIRO
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400 font-sans">
              <span>Exibindo {listaConciliacaoFiltrada.length} de {dadosConciliacao.length} unidades</span>
              <span>Tolerância contábil: ± R$ 0,02</span>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: Comgás */}
      {tab === 'gas' && (
        <div id="panel-gas" role="tabpanel" aria-labelledby="tab-gas" className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-semibold text-white text-sm">Resumo Geral Comgás (16 Medidores Mestres)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Consumo consolidado de gás natural canalizado distribuído nas Torres A até H.
              </p>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-right">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">Tarifa Aplicada no Rateio</span>
              <span className="text-base font-bold text-orange-400 font-mono">
                R$ {dadosGas.tarifaFormatada} / m³ <span className="text-xs text-slate-500 font-normal">({dadosGas.tarifa} precisão)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contasComgas.map((c, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
                <div>
                  <span className="text-slate-200 font-sans font-semibold text-sm">{c.bloco}</span>
                  <p className="text-slate-400 text-[11px]">Conta Contrato: {c.codigo}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-300 font-semibold">{formatarM3(c.volumeM3, 0)} m³</p>
                  <p className="text-orange-400 font-bold">{formatarMoedaBRL(c.valorRs)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Auditoria */}
      {tab === 'auditoria' && (
        <div id="panel-auditoria" role="tabpanel" aria-labelledby="tab-auditoria" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-start sm:items-center pb-4 border-b border-slate-800 mb-4">
            <div>
              <h2 className="font-semibold text-white text-base">Auditoria Cruzada Água x Gás (Regra 3:1) &amp; Retroativos</h2>
              <p className="text-xs text-slate-400 mt-1">
                Identificação de unidades com disparidade de consumo, medidores parados ou manutenções com consumo retroativo.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {casosAuditoria.map((item) => (
              <div 
                key={item.id} 
                className={`border rounded-xl p-4 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition ${
                  item.confirmado 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-sm">{item.unidade}</span>
                    <span className="text-slate-400 font-mono">
                      (Água: {formatarM3(item.consumoAgua)} m³ | Gás: {formatarM3(item.consumoGas)} m³)
                    </span>
                  </div>
                  <p className="text-amber-400">{item.motivo}</p>
                  <p className="text-slate-400 text-[11px]">{item.observacao}</p>
                </div>

                <button 
                  type="button"
                  onClick={() => toggleConfirmarRetroativo(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                    item.confirmado
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                      : 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30'
                  }`}
                >
                  {item.confirmado ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Vistoria Confirmada
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Confirmar Vistoria / Retroativo
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}