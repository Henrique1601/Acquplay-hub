// app/page.tsx
'use client';

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { HeroSection } from '@/components/landing/HeroSection';
import { CondoMetricsBar } from '@/components/landing/CondoMetricsBar';
import { SegmentedTabs, TabId } from '@/components/dashboard/SegmentedTabs';
import { UploadDropzone, UploadStatusState } from '@/components/dashboard/UploadDropzone';
import { ConciliacaoView } from '@/components/dashboard/ConciliacaoView';
import { ComgasView, ContaComgasItem } from '@/components/dashboard/ComgasView';
import { AuditoriaView, CasoAuditoriaItem } from '@/components/dashboard/AuditoriaView';
import { CicloMetadadosBar } from '@/components/dashboard/CicloMetadadosBar';
import { 
  calcularTarifaComgas, 
  calcularValorSabesp,
  conciliarComSergio,
  normalizarChaveUnidade,
  ItemConciliacao, 
  MedicaoIndividual,
  CicloFechamento, 
  gerarRelatorioSergio,
  auditarAguaGas,
  extrairTorre
} from '@/lib/acquaPlayEngine';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const CONTAS_COMGAS_INICIAIS: ContaComgasItem[] = [
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

const CASOS_AUDITORIA_INICIAIS: CasoAuditoriaItem[] = [
  {
    id: '1',
    unidade: 'Torre A - APTO 0048',
    consumoAgua: 40.18,
    consumoGas: 0.0,
    motivo: '⚠️ Meses anteriores zerados e consumo atual de 40.18 m³ (Cyble trocado; Consumo retroativo)',
    confirmado: false,
    observacao: 'Consumo acumulado pós-manutenção do medidor de água.'
  },
  {
    id: '2',
    unidade: 'Torre B - APTO 0112',
    consumoAgua: 28.50,
    consumoGas: 1.20,
    motivo: 'Disparidade 3:1 acentuada (Água 28.5 m³ vs Gás 1.2 m³)',
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
  const [modoFoco, setModoFoco] = useState(false);
  const [tabAtiva, setTabAtiva] = useState<TabId>('upload');
  
  // Dados Comgás 16 Medidores
  const [contasComgas, setContasComgas] = useState<ContaComgasItem[]>(CONTAS_COMGAS_INICIAIS);
  const [manutencaoGasExpurgada, setManutencaoGasExpurgada] = useState(0);

  // Dados Individuais carregados
  const [dadosAgua, setDadosAgua] = useState<MedicaoIndividual[]>([]);
  const [dadosGasIndividual, setDadosGasIndividual] = useState<MedicaoIndividual[]>([]);
  const [dadosSergioAgua, setDadosSergioAgua] = useState<Array<{
    unidade: string;
    torre: string;
    leituraAnterior?: number;
    leituraAtual?: number;
    consumo: number;
    valorSergio: number;
  }>>([]);
  const [dadosSergioGas, setDadosSergioGas] = useState<Array<{
    unidade: string;
    torre: string;
    leituraAnterior?: number;
    leituraAtual?: number;
    consumoGas: number;
    valorGasSergio: number;
  }>>([]);
  const [casosAuditoria, setCasosAuditoria] = useState<CasoAuditoriaItem[]>(CASOS_AUDITORIA_INICIAIS);

  // Status de Upload das 5 planilhas/PDFs
  const [uploadStatus, setUploadStatus] = useState<UploadStatusState>({
    agua: { carregado: false },
    gasIndividual: { carregado: false },
    comgas: { carregado: true, nomeArquivo: '16_Medidores_Padrao.xlsx', total: 16 },
    sergioAgua: { carregado: false },
    sergioGas: { carregado: false }
  });

  const [cicloFechamento, setCicloFechamento] = useState<CicloFechamento>({
    mesReferencia: 'Outubro/2026',
    dataLeituraAnterior: '15/09/2026',
    dataLeituraAtual: '15/10/2026',
    dataProximaLeitura: '15/11/2026'
  });

  // Estados de feedback
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Dados da conciliação consolidada
  const [dadosConciliacao, setDadosConciliacao] = useState<ItemConciliacao[]>([
    {
      unidade: 'Torre A-APTO0031',
      torre: 'TORRE A',
      consumo: 12.84,
      valorHydrojexe: 113.16,
      valorSergio: 113.16,
      status: 'VERDADEIRO',
      diferenca: 0.0,
      diferencaAbs: 0.0,
      consumoGas: 3.5,
      tarifaGasTorre: 5.48,
      valorGasHydrojexe: 19.18,
      valorGasSergio: 0.0,
      statusGas: 'SERGIO_ZERADO',
      valorTotalHydrojexe: 132.34,
      valorTotalSergio: 113.16
    }
  ]);

  const consoleRef = useRef<HTMLDivElement>(null);

  // Cálculos consolidados da Comgás (Preço ÷ Volume por medidor e por torre)
  const dadosGas = useMemo(() => {
    return calcularTarifaComgas(
      contasComgas.map(c => ({
        codigoConta: c.codigo,
        blocoMedidor: c.bloco,
        valorRs: c.valorRs,
        volumeM3: c.volumeM3
      })),
      manutencaoGasExpurgada
    );
  }, [contasComgas, manutencaoGasExpurgada]);

  // Contagens dinâmicas
  const totalUnidades = useMemo(() => {
    if (dadosConciliacao.length > 2) return dadosConciliacao.length;
    if (dadosAgua.length > 0) return dadosAgua.length;
    if (dadosGasIndividual.length > 0) return dadosGasIndividual.length;
    return 1435;
  }, [dadosConciliacao, dadosAgua, dadosGasIndividual]);

  const divergenciasCount = useMemo(() => {
    return dadosConciliacao.filter(item => item.status === 'FALSO').length;
  }, [dadosConciliacao]);
  const aprovadosCount = dadosConciliacao.length - divergenciasCount;

  // Função para sintetizar dados individuais (Nossos Extratos) com Demonstrativos do Sérgio (Água & Gás)
  const atualizarSintese = (
    novosItensAgua: MedicaoIndividual[], 
    novosItensGas: MedicaoIndividual[], 
    novosSergioAgua = dadosSergioAgua,
    novosSergioGas = dadosSergioGas
  ) => {
    const mapaAgua = new Map<string, MedicaoIndividual>();
    novosItensAgua.forEach(i => mapaAgua.set(normalizarChaveUnidade(i.unidade), i));

    const mapaGas = new Map<string, MedicaoIndividual>();
    novosItensGas.forEach(i => mapaGas.set(normalizarChaveUnidade(i.unidade), i));

    const mapaSergioAgua = new Map<string, typeof novosSergioAgua[number]>();
    novosSergioAgua.forEach(i => mapaSergioAgua.set(normalizarChaveUnidade(i.unidade), i));

    const mapaSergioGas = new Map<string, typeof novosSergioGas[number]>();
    novosSergioGas.forEach(i => mapaSergioGas.set(normalizarChaveUnidade(i.unidade), i));

    const todasChaves = Array.from(new Set([
      ...Array.from(mapaAgua.keys()),
      ...Array.from(mapaGas.keys()),
      ...Array.from(mapaSergioAgua.keys()),
      ...Array.from(mapaSergioGas.keys()),
    ]));

    if (todasChaves.length === 0) return;

    const novasVistorias: CasoAuditoriaItem[] = [];
    const listaFinal: ItemConciliacao[] = todasChaves.map(chave => {
      const medAgua = mapaAgua.get(chave);
      const medGas = mapaGas.get(chave);
      const sAgua = mapaSergioAgua.get(chave);
      const sGas = mapaSergioGas.get(chave);

      const unidade = medAgua?.unidade || sAgua?.unidade || medGas?.unidade || sGas?.unidade || chave;
      const torre = extrairTorre(unidade);

      // Água: usa nossos índices (Extrato) quando carregado; senão usa o consumo do Demonstrativo do Sérgio
      const consumoAgua = medAgua ? medAgua.consumo : (sAgua?.consumo ?? 0);
      const leituraAnteriorAgua = medAgua?.leituraAnterior ?? sAgua?.leituraAnterior;
      const leituraAtualAgua = medAgua?.leituraAtual ?? sAgua?.leituraAtual;
      const valorSergioAgua = sAgua ? sAgua.valorSergio : calcularValorSabesp(consumoAgua);
      const auditAgua = conciliarComSergio(
        unidade,
        consumoAgua,
        valorSergioAgua,
        leituraAnteriorAgua,
        leituraAtualAgua
      );

      // Gás: usa nossos índices (Extrato Gás) quando carregado; senão usa o consumo do Demonstrativo Gás do Sérgio
      const consumoGas = medGas ? medGas.consumo : (sGas?.consumoGas ?? 0);
      const tarifaTorre = dadosGas.tarifasPorTorre[torre] || dadosGas.tarifa;
      const valorGasHydrojexe = Number((consumoGas * tarifaTorre).toFixed(2));
      const valorGasSergio = sGas?.valorGasSergio ?? 0;

      let statusGas: 'VERDADEIRO' | 'FALSO' | 'SERGIO_ZERADO' | undefined;
      if (consumoGas > 0) {
        if (valorGasSergio === 0) {
          statusGas = 'SERGIO_ZERADO';
        } else {
          statusGas = Math.abs(valorGasHydrojexe - valorGasSergio) <= 0.05 ? 'VERDADEIRO' : 'FALSO';
        }
      }

      if (consumoAgua > 0 || consumoGas > 0) {
        const audit = auditarAguaGas(consumoAgua, consumoGas);
        if (audit.vistoriarAgua || audit.vistoriarGas) {
          novasVistorias.push({
            id: `${unidade}-${novasVistorias.length}`,
            unidade,
            consumoAgua,
            consumoGas,
            motivo: audit.motivo || 'Disparidade 3:1 detectada',
            confirmado: false,
            observacao: audit.vistoriarGas ? 'Vistoriar gasômetro' : 'Vistoriar hidrômetro'
          });
        }
      }

      return {
        unidade,
        torre,
        consumo: consumoAgua,
        valorHydrojexe: auditAgua.valorHydrojexe,
        valorSergio: sAgua ? auditAgua.valorSergio : auditAgua.valorHydrojexe,
        status: sAgua ? auditAgua.status : 'VERDADEIRO',
        diferenca: sAgua ? auditAgua.diferenca : 0,
        diferencaAbs: sAgua ? auditAgua.diferencaAbs : 0,
        leituraAnterior: leituraAnteriorAgua,
        leituraAtual: leituraAtualAgua,
        leituraAnteriorSergio: sAgua?.leituraAnterior,
        leituraAtualSergio: sAgua?.leituraAtual,
        consumoSergio: sAgua?.consumo,
        tipoAnomalia: auditAgua.tipoAnomalia,
        observacao: auditAgua.observacao,
        leituraAnteriorGas: medGas?.leituraAnterior,
        leituraAtualGas: medGas?.leituraAtual,
        consumoGas,
        leituraAnteriorGasSergio: sGas?.leituraAnterior,
        leituraAtualGasSergio: sGas?.leituraAtual,
        consumoGasSergio: sGas?.consumoGas,
        tarifaGasTorre: tarifaTorre,
        valorGasHydrojexe,
        valorGasSergio,
        statusGas,
        diferencaGas: Number((valorGasHydrojexe - valorGasSergio).toFixed(2)),
        valorTotalHydrojexe: Number((auditAgua.valorHydrojexe + valorGasHydrojexe).toFixed(2)),
        valorTotalSergio: Number(((sAgua ? auditAgua.valorSergio : 0) + valorGasSergio).toFixed(2))
      };
    });

    setDadosConciliacao(listaFinal);
    if (novasVistorias.length > 0) {
      setCasosAuditoria(novasVistorias.slice(0, 100));
    }
  };

  // 1. Upload de Medições de Água
  const handleUploadAgua = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', 'agua');

      const res = await fetch('/api/processar-planilha', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar medições de água.');
      }

      const itens = data.itens as MedicaoIndividual[];
      setDadosAgua(itens);
      setUploadStatus(prev => ({
        ...prev,
        agua: { carregado: true, nomeArquivo: file.name, total: itens.length }
      }));

      atualizarSintese(itens, dadosGasIndividual, dadosSergioAgua, dadosSergioGas);

      setUploadSuccessMessage(`Nosso Extrato de Água "${file.name}" carregado com sucesso: ${itens.length} hidrômetros individualizados.`);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Falha ao processar água.');
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Upload de Medições de Gás Individual
  const handleUploadGasIndividual = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', 'gas_individual');
      formData.append('tarifasPorTorre', JSON.stringify(dadosGas.tarifasPorTorre));

      const res = await fetch('/api/processar-planilha', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar medições de gás individual.');
      }

      const itens = data.itens as MedicaoIndividual[];
      setDadosGasIndividual(itens);
      setUploadStatus(prev => ({
        ...prev,
        gasIndividual: { carregado: true, nomeArquivo: file.name, total: itens.length }
      }));

      atualizarSintese(dadosAgua, itens, dadosSergioAgua, dadosSergioGas);

      setUploadSuccessMessage(`Nosso Extrato de Gás "${file.name}" carregado: ${itens.length} gasômetros calculados com tarifa da torre.`);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Falha ao processar gás individual.');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Upload de Contas Comgás dos 16 Medidores Mestres (PDFs ou Excel)
  const handleUploadComgas = async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('tipo', 'comgas');
      formData.append('manutencaoGas', String(manutencaoGasExpurgada));

      const res = await fetch('/api/processar-planilha', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar contas da Comgás.');
      }

      const contas = data.contas.map((c: { codigoConta: string; blocoMedidor: string; valorRs: number; volumeM3: number }) => ({
        codigo: c.codigoConta,
        bloco: c.blocoMedidor,
        valorRs: c.valorRs,
        volumeM3: c.volumeM3
      }));

      setContasComgas(contas);
      setUploadStatus(prev => ({
        ...prev,
        comgas: {
          carregado: true,
          nomeArquivo: data.nomeArquivo || (files.length === 1 ? files[0].name : `${files.length} faturas PDF`),
          total: contas.length
        }
      }));

      // Recalcula síntese com novas tarifas de torre
      atualizarSintese(dadosAgua, dadosGasIndividual, dadosSergioAgua, dadosSergioGas);

      setUploadSuccessMessage(`Contas Comgás processadas (${contas.length} medidores): tarifas calculadas por Preço ÷ Volume.`);
      setTabAtiva('gas');
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Falha ao processar Comgás.');
    } finally {
      setIsUploading(false);
    }
  };

  // 4A. Upload do Demonstrativo do Sérgio — ÁGUA
  const handleUploadSergioAgua = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', 'sergio_agua');

      const res = await fetch('/api/processar-planilha', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar Demonstrativo de Água do Sérgio.');
      }

      const itens = data.itens as typeof dadosSergioAgua;
      setDadosSergioAgua(itens);
      setUploadStatus(prev => ({
        ...prev,
        sergioAgua: { carregado: true, nomeArquivo: file.name, total: itens.length }
      }));

      atualizarSintese(dadosAgua, dadosGasIndividual, itens, dadosSergioGas);

      setUploadSuccessMessage(`Demonstrativo Sérgio (Água) "${file.name}" carregado: ${itens.length} unidades cruzadas na Tabela Sabesp 2026.`);
      setTabAtiva('conciliacao');
      consoleRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Falha na comunicação com o servidor.');
    } finally {
      setIsUploading(false);
    }
  };

  // 4B. Upload do Demonstrativo do Sérgio — GÁS
  const handleUploadSergioGas = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', 'sergio_gas');

      const res = await fetch('/api/processar-planilha', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar Demonstrativo de Gás do Sérgio.');
      }

      const itens = data.itens as typeof dadosSergioGas;
      setDadosSergioGas(itens);
      setUploadStatus(prev => ({
        ...prev,
        sergioGas: { carregado: true, nomeArquivo: file.name, total: itens.length }
      }));

      atualizarSintese(dadosAgua, dadosGasIndividual, dadosSergioAgua, itens);

      const zerados = itens.filter(i => i.consumoGas > 0 && i.valorGasSergio === 0).length;
      let msg = `Demonstrativo Sérgio (Gás) "${file.name}" carregado: ${itens.length} unidades cruzadas.`;
      if (zerados > 0) {
        msg += ` ℹ️ ${zerados} unidades vieram com valor zerado no Sérgio; aplicada tarifa por torre da Comgás.`;
      }
      setUploadSuccessMessage(msg);
      setTabAtiva('conciliacao');
      consoleRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Falha na comunicação com o servidor.');
    } finally {
      setIsUploading(false);
    }
  };

  // Exportar Excel Multi-Abas Completo
  const handleExportarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Aba 1: Conciliação Consolidada
      const dadosExportConciliacao = dadosConciliacao.map(item => ({
        'Unidade': item.unidade,
        'Torre': item.torre || extrairTorre(item.unidade),
        'Consumo Água Sabesp (m³)': item.consumo,
        'Valor Água Hydrojexe (R$)': item.valorHydrojexe,
        'Valor Água Sérgio (R$)': item.valorSergio,
        'Status Água': item.status,
        'Diff Água (R$)': item.diferenca,
        'Consumo Gás (m³)': item.consumoGas ?? 'N/A',
        'Tarifa Torre (R$/m³)': item.tarifaGasTorre ? item.tarifaGasTorre.toFixed(4) : 'N/A',
        'Valor Gás Hydrojexe (R$)': item.valorGasHydrojexe ?? 'N/A',
        'Valor Gás Sérgio (R$)': item.valorGasSergio ?? 0,
        'Status Gás': item.statusGas === 'SERGIO_ZERADO' ? 'SÉRGIO ZERADO (APLICADA TARIFA TORRE)' : (item.statusGas ?? 'N/A'),
        'Valor Total Hydrojexe (R$)': item.valorTotalHydrojexe ?? item.valorHydrojexe,
        'Valor Total Sérgio (R$)': item.valorTotalSergio ?? item.valorSergio,
        'Observações': item.observacao || ''
      }));
      const wsConciliacao = XLSX.utils.json_to_sheet(dadosExportConciliacao);
      XLSX.utils.book_append_sheet(wb, wsConciliacao, 'Conciliacao_Geral');

      // Aba 2: Tabela Sabesp (Nossos Índices x Preço Sérgio)
      const dadosTabelaSabesp = dadosConciliacao.map(item => ({
        'Unidade': item.unidade,
        'Leitura Anterior (Nosso)': item.leituraAnterior ?? '',
        'Leitura Atual (Nosso)': item.leituraAtual ?? '',
        'Consumo Água (m³)': item.consumo,
        'Valor Sabesp Hydrojexe (R$)': item.valorHydrojexe,
        'Valor Sérgio (R$)': item.valorSergio,
        'Comparativo': item.status,
        'Diferença (R$)': item.diferenca,
        'Consumo Sérgio (m³)': item.consumoSergio ?? '',
        'Observações': item.observacao || ''
      }));
      const wsSabesp = XLSX.utils.json_to_sheet(dadosTabelaSabesp);
      XLSX.utils.book_append_sheet(wb, wsSabesp, 'Tabela_Sabesp');

      // Aba 3: Comgás 16 Medidores Mestres (com fórmula Preço ÷ Volume)
      const dadosExportGas = contasComgas.map(c => {
        const tarifaMedidor = c.volumeM3 > 0 ? c.valorRs / c.volumeM3 : 0;
        return {
          'Torre / Medidor': c.bloco,
          'Conta Contrato Comgás': c.codigo,
          'Volume Faturado (m³)': c.volumeM3,
          'Valor Fatura (R$)': c.valorRs,
          'Tarifa do Medidor (Preço ÷ Volume)': tarifaMedidor.toFixed(4),
          'Tarifa Rateio Média Condomínio': dadosGas.tarifaFormatada
        };
      });
      const wsGas = XLSX.utils.json_to_sheet(dadosExportGas);
      XLSX.utils.book_append_sheet(wb, wsGas, 'Comgas_16_Medidores');

      // Aba 3: Medições de Água Individual (se carregada)
      if (dadosAgua.length > 0) {
        const dadosExportAgua = dadosAgua.map(a => ({
          'Unidade': a.unidade,
          'Torre': a.torre,
          'Leitura Anterior': a.leituraAnterior ?? 'N/A',
          'Leitura Atual': a.leituraAtual ?? 'N/A',
          'Consumo Apurado (m³)': a.consumo,
          'Valor Sabesp 2026 (R$)': a.valorCalculado ?? 0,
          'Anomalia': a.tipoAnomalia ?? 'NORMAL',
          'Observações': a.observacao || ''
        }));
        const wsAgua = XLSX.utils.json_to_sheet(dadosExportAgua);
        XLSX.utils.book_append_sheet(wb, wsAgua, 'Medicoes_Agua_Individual');
      }

      // Aba 4: Medições de Gás Individual (se carregada)
      if (dadosGasIndividual.length > 0) {
        const dadosExportGasInd = dadosGasIndividual.map(g => ({
          'Unidade': g.unidade,
          'Torre': g.torre,
          'Leitura Anterior': g.leituraAnterior ?? 'N/A',
          'Leitura Atual': g.leituraAtual ?? 'N/A',
          'Consumo Apurado (m³)': g.consumo,
          'Valor Gás (R$)': g.valorCalculado ?? 0,
          'Anomalia': g.tipoAnomalia ?? 'NORMAL',
          'Observações': g.observacao || ''
        }));
        const wsGasInd = XLSX.utils.json_to_sheet(dadosExportGasInd);
        XLSX.utils.book_append_sheet(wb, wsGasInd, 'Medicoes_Gas_Individual');
      }

      // Aba 5: Vistorias Cruzadas 3:1
      const dadosExportAuditoria = casosAuditoria.map(a => ({
        'Unidade': a.unidade,
        'Consumo Água (m³)': a.consumoAgua,
        'Consumo Gás (m³)': a.consumoGas,
        'Motivo / Alerta': a.motivo,
        'Status Confirmação': a.confirmado ? 'Confirmado' : 'Pendente',
        'Observações': a.observacao
      }));
      const wsAuditoria = XLSX.utils.json_to_sheet(dadosExportAuditoria);
      XLSX.utils.book_append_sheet(wb, wsAuditoria, 'Vistorias_Auditoria_3x1');

      const dataAtual = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `AcquaPlay_Fechamento_${cicloFechamento.mesReferencia.replace('/', '_')}_${dataAtual}.xlsx`);
    } catch {
      alert('Falha ao exportar planilha Excel.');
    }
  };

  const handleCopiarRelatorioSergio = () => {
    const relatorio = gerarRelatorioSergio(
      cicloFechamento,
      dadosConciliacao,
      {
        tarifaFormatada: dadosGas.tarifaFormatada,
        manutencaoExpurgada: dadosGas.manutencaoExpurgadaRs,
        totalLiquidoRs: dadosGas.totalLiquidoRs,
        totalM3: dadosGas.totalM3
      }
    );
    navigator.clipboard.writeText(relatorio);
    setUploadSuccessMessage('Relatório oficial copiado! Pronto para colar no WhatsApp ou Word para o Sérgio.');
  };

  const toggleConfirmarRetroativo = (id: string) => {
    setCasosAuditoria(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, confirmado: !item.confirmado };
      }
      return item;
    }));
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col justify-between">
      <div>
        {/* Seção Hero e Identidade de Marca */}
        <HeroSection
          modoFoco={modoFoco}
          onToggleModoFoco={() => setModoFoco(prev => !prev)}
          onExportarExcel={handleExportarExcel}
          onRolarParaConsole={() => consoleRef.current?.scrollIntoView({ behavior: 'smooth' })}
        />
        
        {/* Barra de Metadados do Ciclo */}
        <CicloMetadadosBar
          ciclo={cicloFechamento}
          onAtualizarCiclo={(campo, valor) => setCicloFechamento(prev => ({ ...prev, [campo]: valor }))}
        />

        {/* Feedback de Operação (Alertas Acessíveis) */}
        {uploadError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3" role="alert">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Falha no processamento</p>
              <p className="text-rose-200/80 mt-0.5">{uploadError}</p>
            </div>
          </div>
        )}

        {uploadSuccessMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3" role="status">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Processamento Concluído</p>
              <p className="text-emerald-200/80 mt-0.5">{uploadSuccessMessage}</p>
            </div>
          </div>
        )}

        {/* Métricas do Condomínio */}
        <CondoMetricsBar
          totalUnidades={totalUnidades}
          totalRsGas={dadosGas.totalLiquidoRs}
          totalM3Gas={dadosGas.totalM3}
          tarifaFormatadaGas={dadosGas.tarifaFormatada}
          tarifaPrecisaGas={dadosGas.tarifa}
          divergenciasCount={divergenciasCount}
          aprovadosCount={aprovadosCount}
          vistoriasCount={casosAuditoria.length}
        />

        {/* Console Operacional (Abas Segmentadas) */}
        <div ref={consoleRef} className="pt-2">
          <SegmentedTabs
            tabAtiva={tabAtiva}
            onSelecionarTab={setTabAtiva}
            contagemConciliacao={dadosConciliacao.length}
            contagemAuditoria={casosAuditoria.length}
          />

          {/* Paineis das Abas */}
          <div className="transition-opacity duration-150">
            {tabAtiva === 'upload' && (
              <UploadDropzone
                isUploading={isUploading}
                uploadStatus={uploadStatus}
                onUploadAgua={handleUploadAgua}
                onUploadGasIndividual={handleUploadGasIndividual}
                onUploadComgas={handleUploadComgas}
                onUploadSergioAgua={handleUploadSergioAgua}
                onUploadSergioGas={handleUploadSergioGas}
                onIrParaConciliacao={() => setTabAtiva('conciliacao')}
                onIrParaComgas={() => setTabAtiva('gas')}
              />
            )}

            {tabAtiva === 'conciliacao' && (
              <ConciliacaoView
                dados={dadosConciliacao}
                onExportarExcel={handleExportarExcel}
                onCopiarRelatorioSergio={handleCopiarRelatorioSergio}
              />
            )}

            {tabAtiva === 'gas' && (
              <ComgasView
                contas={contasComgas}
                tarifaFormatada={dadosGas.tarifaFormatada}
                tarifaPrecisa={dadosGas.tarifa}
                totalRs={dadosGas.totalLiquidoRs}
                totalM3={dadosGas.totalM3}
                tarifasPorTorre={dadosGas.tarifasPorTorre}
                onAtualizarManutencao={setManutencaoGasExpurgada}
              />
            )}

            {tabAtiva === 'auditoria' && (
              <AuditoriaView
                casos={casosAuditoria}
                onToggleConfirmacao={toggleConfirmarRetroativo}
              />
            )}
          </div>
        </div>
      </div>

      {/* Rodapé Editorial Discreto */}
      <footer className="mt-16 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <p>
          AcquaPlay Home &amp; Resort • Individualização de Água &amp; Gás • Santos/SP
        </p>
        <p className="font-mono text-[11px]">
          Hydrojexe Individualizações © 2026 • 16 Medidores Mestres &amp; 1.435 Unidades Individualizadas
        </p>
      </footer>
    </main>
  );
}
