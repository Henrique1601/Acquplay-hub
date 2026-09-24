// app/page.tsx
'use client';

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { HeroSection } from '@/components/landing/HeroSection';
import { CondoMetricsBar } from '@/components/landing/CondoMetricsBar';
import { SegmentedTabs, TabId } from '@/components/dashboard/SegmentedTabs';
import { UploadDropzone } from '@/components/dashboard/UploadDropzone';
import { ConciliacaoView } from '@/components/dashboard/ConciliacaoView';
import { ComgasView, ContaComgasItem } from '@/components/dashboard/ComgasView';
import { AuditoriaView, CasoAuditoriaItem } from '@/components/dashboard/AuditoriaView';
import { calcularTarifaComgas, ItemConciliacao } from '@/lib/acquaPlayEngine';
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
  { codigo: '30461507', bloco: 'TORRE F - MEDIDOR 2', volumeM3: 1665, valorRs: 9120.30 },
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
    motivo: '⚠️ Meses anteriores zerados e consumo atual de 40.18 m³ (Cyble trocado 20/08/26; Consumo retroativo)',
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
  const [contasComgas] = useState<ContaComgasItem[]>(CONTAS_COMGAS_INICIAIS);
  const [casosAuditoria, setCasosAuditoria] = useState<CasoAuditoriaItem[]>(CASOS_AUDITORIA_INICIAIS);

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

  const consoleRef = useRef<HTMLDivElement>(null);

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
  const totalUnidades = dadosConciliacao.length > 2 ? dadosConciliacao.length : 1435;
  const divergenciasCount = useMemo(() => {
    return dadosConciliacao.filter(item => item.status === 'FALSO').length;
  }, [dadosConciliacao]);
  const aprovadosCount = dadosConciliacao.length - divergenciasCount;

  // Upload handler
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
        `Planilha "${file.name}" processada com sucesso: ${data.total} unidades conciliadas com a tabela Sabesp 2026.`
      );
      setTabAtiva('conciliacao');
      consoleRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na comunicação com o servidor.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Exportar Excel
  const handleExportarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Aba 1: Conciliação Sabesp
      const dadosExportConciliacao = dadosConciliacao.map(item => ({
        'Unidade / Apartamento': item.unidade,
        'Consumo Sabesp (m³)': item.consumo,
        'Cálculo Hydrojexe (R$)': item.valorHydrojexe,
        'Folha Sérgio (R$)': item.valorSergio,
        'Status Conciliação': item.status,
        'Diferença (R$)': item.diferenca
      }));
      const wsConciliacao = XLSX.utils.json_to_sheet(dadosExportConciliacao);
      XLSX.utils.book_append_sheet(wb, wsConciliacao, 'Conciliacao_Sabesp');

      // Aba 2: Comgás 16 Medidores
      const dadosExportGas = contasComgas.map(c => ({
        'Torre / Medidor': c.bloco,
        'Código Comgás': c.codigo,
        'Volume (m³)': c.volumeM3,
        'Valor Total (R$)': c.valorRs,
        'Tarifa Rateio (R$/m³)': dadosGas.tarifaFormatada
      }));
      const wsGas = XLSX.utils.json_to_sheet(dadosExportGas);
      XLSX.utils.book_append_sheet(wb, wsGas, 'Medidores_Comgas');

      // Aba 3: Vistorias 3:1
      const dadosExportAuditoria = casosAuditoria.map(a => ({
        'Unidade': a.unidade,
        'Consumo Água (m³)': a.consumoAgua,
        'Consumo Gás (m³)': a.consumoGas,
        'Motivo / Alerta': a.motivo,
        'Status Confirmação': a.confirmado ? 'Confirmado' : 'Pendente',
        'Observações': a.observacao
      }));
      const wsAuditoria = XLSX.utils.json_to_sheet(dadosExportAuditoria);
      XLSX.utils.book_append_sheet(wb, wsAuditoria, 'Vistorias_Auditoria');

      const dataAtual = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `AcquaPlay_Fechamento_${dataAtual}.xlsx`);
    } catch {
      alert('Falha ao exportar planilha Excel.');
    }
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
              <p className="font-semibold text-sm">Conciliação Concluída</p>
              <p className="text-emerald-200/80 mt-0.5">{uploadSuccessMessage}</p>
            </div>
          </div>
        )}

        {/* Métricas do Condomínio */}
        <CondoMetricsBar
          totalUnidades={totalUnidades}
          totalRsGas={dadosGas.totalRs}
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
                onUploadSergio={handleUploadSergio}
                onIrParaConciliacao={() => setTabAtiva('conciliacao')}
                temDadosCarregados={dadosConciliacao.length > 2}
              />
            )}

            {tabAtiva === 'conciliacao' && (
              <ConciliacaoView
                dados={dadosConciliacao}
                onExportarExcel={handleExportarExcel}
              />
            )}

            {tabAtiva === 'gas' && (
              <ComgasView
                contas={contasComgas}
                tarifaFormatada={dadosGas.tarifaFormatada}
                tarifaPrecisa={dadosGas.tarifa}
                totalRs={dadosGas.totalRs}
                totalM3={dadosGas.totalM3}
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
          Hydrojexe Individualizações © 2026 • Precisão Algorítmica Sabesp &amp; Comgás
        </p>
      </footer>
    </main>
  );
}