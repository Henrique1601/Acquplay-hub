// components/dashboard/UploadDropzone.tsx
import React, { useId, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Droplets, 
  Flame, 
  Building2, 
  Scale, 
  UploadCloud, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Info
} from 'lucide-react';

export interface UploadStatusState {
  agua: { carregado: boolean; nomeArquivo?: string; total?: number };
  gasIndividual: { carregado: boolean; nomeArquivo?: string; total?: number };
  comgas: { carregado: boolean; nomeArquivo?: string; total?: number };
  sergioAgua: { carregado: boolean; nomeArquivo?: string; total?: number };
  sergioGas: { carregado: boolean; nomeArquivo?: string; total?: number };
}

interface UploadDropzoneProps {
  isUploading: boolean;
  uploadStatus: UploadStatusState;
  onUploadAgua: (file: File) => Promise<void>;
  onUploadGasIndividual: (file: File) => Promise<void>;
  onUploadComgas: (files: File[]) => Promise<void>;
  onUploadSergioAgua: (file: File) => Promise<void>;
  onUploadSergioGas: (file: File) => Promise<void>;
  onIrParaConciliacao: () => void;
  onIrParaComgas: () => void;
}

export function UploadDropzone({
  isUploading,
  uploadStatus,
  onUploadAgua,
  onUploadGasIndividual,
  onUploadComgas,
  onUploadSergioAgua,
  onUploadSergioGas,
  onIrParaConciliacao,
  onIrParaComgas
}: UploadDropzoneProps) {
  const [dragCard, setDragCard] = useState<string | null>(null);

  const idAgua = useId();
  const idGasInd = useId();
  const idComgas = useId();
  const idSergioAgua = useId();
  const idSergioGas = useId();

  const handleDrop = (e: React.DragEvent, uploadFn: (file: File) => Promise<void>) => {
    e.preventDefault();
    setDragCard(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFn(file);
    }
  };

  const handleDropMulti = (e: React.DragEvent, uploadFn: (files: File[]) => Promise<void>) => {
    e.preventDefault();
    setDragCard(null);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      uploadFn(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, uploadFn: (file: File) => Promise<void>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFn(file);
      e.target.value = '';
    }
  };

  const handleChangeMulti = (e: React.ChangeEvent<HTMLInputElement>, uploadFn: (files: File[]) => Promise<void>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFn(files);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Orientativo do Processo de Individualização */}
      <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-800/40 text-xs text-sky-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-sky-100 text-sm">
            Estrutura Completa de Individualização do AcquaPlay (1.435 Unidades)
          </p>
          <p className="text-sky-300/80 leading-relaxed">
            Cada apartamento possui <strong>medidor individual de água e de gás</strong>. No 1º andar, existem <strong>16 medidores mestres da Comgás</strong> (2 por torre). A tarifa da Comgás de cada torre é obtida dividindo o <em>preço de cada fatura pelo consumo (volume m³)</em> daquele medidor. Carregue as planilhas abaixo para auditoria e conciliação instantânea.
          </p>
        </div>
      </div>

      {/* Grid de 4 Cards de Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Medições de Água Individual (Sabesp) */}
        <GlassCard 
          className={`p-6 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200 ${
            dragCard === 'agua' ? 'border-sky-400 bg-sky-950/20' : 'hover:border-sky-500/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragCard('agua'); }}
          onDragLeave={() => setDragCard(null)}
          onDrop={(e) => handleDrop(e, onUploadAgua)}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
                <Droplets className="w-6 h-6" />
              </div>
              {uploadStatus.agua.carregado ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  {uploadStatus.agua.total} hidrômetros
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Individual Sabesp
                </span>
              )}
            </div>

            <h3 className="font-semibold text-white text-base">
              1. Nosso Extrato — Água (Hydrojexe)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Nosso extrato de água (Leitura Anterior, Atual e Consumo m³ dos 1.435 aptos). Calcula automaticamente pela Tabela Sabesp 2026.
            </p>

            {uploadStatus.agua.nomeArquivo && (
              <p className="text-[11px] font-mono text-sky-300/80 mt-3 truncate flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                <span className="truncate">{uploadStatus.agua.nomeArquivo}</span>
              </p>
            )}
          </div>

          <div className="w-full mt-6">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id={idAgua}
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => handleChange(e, onUploadAgua)}
            />
            <label
              htmlFor={idAgua}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById(idAgua)?.click();
                }
              }}
              className="apple-press w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-sky-600/90 hover:bg-sky-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-900/20"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando Água...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadStatus.agua.carregado ? 'Substituir Planilha de Água' : 'Carregar Medições de Água (.xlsx)'}</span>
                </>
              )}
            </label>
          </div>
        </GlassCard>

        {/* 2. Medições de Gás Individual */}
        <GlassCard 
          className={`p-6 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200 ${
            dragCard === 'gas' ? 'border-amber-400 bg-amber-950/20' : 'hover:border-amber-500/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragCard('gas'); }}
          onDragLeave={() => setDragCard(null)}
          onDrop={(e) => handleDrop(e, onUploadGasIndividual)}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Flame className="w-6 h-6" />
              </div>
              {uploadStatus.gasIndividual.carregado ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  {uploadStatus.gasIndividual.total} gasômetros
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Individual Gás
                </span>
              )}
            </div>

            <h3 className="font-semibold text-white text-base">
              2. Nosso Extrato Gás — Mês Anterior (Opcional)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Nosso extrato de gás do mês passado: puxa automaticamente a <strong>Leitura Atual anterior</strong> para ser a <strong>Leitura Anterior</strong> deste mês (se não subir, usa a do Demonstrativo).
            </p>

            {uploadStatus.gasIndividual.nomeArquivo && (
              <p className="text-[11px] font-mono text-amber-300/80 mt-3 truncate flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{uploadStatus.gasIndividual.nomeArquivo}</span>
              </p>
            )}
          </div>

          <div className="w-full mt-6">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id={idGasInd}
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => handleChange(e, onUploadGasIndividual)}
            />
            <label
              htmlFor={idGasInd}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById(idGasInd)?.click();
                }
              }}
              className="apple-press w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-600/90 hover:bg-amber-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-900/20"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando Gás...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadStatus.gasIndividual.carregado ? 'Substituir Planilha de Gás' : 'Carregar Medições de Gás (.xlsx)'}</span>
                </>
              )}
            </label>
          </div>
        </GlassCard>

        {/* 3. Contas Comgás dos 16 Medidores Mestres (PDFs ou Excel) */}
        <GlassCard 
          className={`p-6 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200 md:col-span-2 ${
            dragCard === 'comgas' ? 'border-violet-400 bg-violet-950/20' : 'hover:border-violet-500/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragCard('comgas'); }}
          onDragLeave={() => setDragCard(null)}
          onDrop={(e) => handleDropMulti(e, onUploadComgas)}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center text-violet-400">
                <Building2 className="w-6 h-6" />
              </div>
              {uploadStatus.comgas.carregado ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                  {uploadStatus.comgas.total} medidores mestres
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  16 Faturas PDF ou Excel
                </span>
              )}
            </div>

            <h3 className="font-semibold text-white text-base">
              3. Contas Comgás — 16 Medidores Mestres (PDFs ou .xlsx)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Selecione de uma vez os <strong>16 PDFs baixados da Comgás</strong> (ou a planilha Contas Comgás .xlsx). O sistema extrai Valor (R$) e Consumo (m³) de cada medidor e calcula a tarifa (Preço ÷ Volume).
            </p>

            {uploadStatus.comgas.nomeArquivo && (
              <p className="text-[11px] font-mono text-violet-300/80 mt-3 truncate flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                <span className="truncate">{uploadStatus.comgas.nomeArquivo}</span>
              </p>
            )}
          </div>

          <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                multiple
                id={idComgas}
                className="sr-only"
                disabled={isUploading}
                onChange={(e) => handleChangeMulti(e, onUploadComgas)}
              />
              <label
                htmlFor={idComgas}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    document.getElementById(idComgas)?.click();
                  }
                }}
                className="apple-press w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-violet-600/90 hover:bg-violet-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-violet-900/20"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando Faturas Comgás...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadStatus.comgas.carregado ? 'Substituir PDFs / Planilha Comgás' : 'Selecionar 16 PDFs ou .xlsx'}</span>
                  </>
                )}
              </label>
            </div>

            {uploadStatus.comgas.carregado && (
              <button
                type="button"
                onClick={onIrParaComgas}
                className="apple-press w-full py-2.5 px-3 rounded-xl text-xs font-medium text-violet-300 hover:text-violet-200 bg-violet-950/40 border border-violet-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ver cálculo detalhado dos 16 medidores</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </GlassCard>

        {/* 4. Demonstrativo do Sérgio — ÁGUA */}
        <GlassCard 
          className={`p-6 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200 ${
            dragCard === 'sergioAgua' ? 'border-emerald-400 bg-emerald-950/20' : 'hover:border-emerald-500/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragCard('sergioAgua'); }}
          onDragLeave={() => setDragCard(null)}
          onDrop={(e) => handleDrop(e, onUploadSergioAgua)}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                <Scale className="w-6 h-6" />
              </div>
              {uploadStatus.sergioAgua.carregado ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {uploadStatus.sergioAgua.total} aptos (Água)
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Demonstrativo Água
                </span>
              )}
            </div>

            <h3 className="font-semibold text-white text-base">
              4. Demonstrativo Sérgio — Água
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Planilha <em>Demonstrativo de Consumo Geral de Água</em> (lê automaticamente a aba <strong>ContaJusta</strong> bruta ou a <strong>Desmembrada</strong>) para cruzar preço Sabesp e índices.
            </p>

            {uploadStatus.sergioAgua.nomeArquivo && (
              <p className="text-[11px] font-mono text-emerald-300/80 mt-3 truncate flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">{uploadStatus.sergioAgua.nomeArquivo}</span>
              </p>
            )}
          </div>

          <div className="w-full mt-6 space-y-2">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id={idSergioAgua}
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => handleChange(e, onUploadSergioAgua)}
            />
            <label
              htmlFor={idSergioAgua}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById(idSergioAgua)?.click();
                }
              }}
              className="apple-press w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/20"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando Demonstrativo Água...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadStatus.sergioAgua.carregado ? 'Substituir Demonstrativo Água' : 'Carregar Demonstrativo Água (.xlsx)'}</span>
                </>
              )}
            </label>

            {(uploadStatus.sergioAgua.carregado || uploadStatus.sergioGas.carregado) && (
              <button
                type="button"
                onClick={onIrParaConciliacao}
                className="apple-press w-full py-1.5 px-3 rounded-lg text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 border border-emerald-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ver Tabela Sabesp / Conciliação</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </GlassCard>

        {/* 5. Demonstrativo do Sérgio — GÁS */}
        <GlassCard 
          className={`p-6 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200 ${
            dragCard === 'sergioGas' ? 'border-teal-400 bg-teal-950/20' : 'hover:border-teal-500/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragCard('sergioGas'); }}
          onDragLeave={() => setDragCard(null)}
          onDrop={(e) => handleDrop(e, onUploadSergioGas)}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-400/20 flex items-center justify-center text-teal-400">
                <Scale className="w-6 h-6" />
              </div>
              {uploadStatus.sergioGas.carregado ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  {uploadStatus.sergioGas.total} aptos (Gás)
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Demonstrativo Gás
                </span>
              )}
            </div>

            <h3 className="font-semibold text-white text-base">
              5. Demonstrativo Sérgio — Gás (Índices &amp; Consumo)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Fonte oficial do consumo e leitura atual de gás dos apartamentos. Aplica o <strong>Fator Comgás</strong> (Valor ÷ Volume) e sinaliza consumos negativos / troca de cyble.
            </p>

            {uploadStatus.sergioGas.nomeArquivo && (
              <p className="text-[11px] font-mono text-teal-300/80 mt-3 truncate flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                <span className="truncate">{uploadStatus.sergioGas.nomeArquivo}</span>
              </p>
            )}
          </div>

          <div className="w-full mt-6 space-y-2">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id={idSergioGas}
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => handleChange(e, onUploadSergioGas)}
            />
            <label
              htmlFor={idSergioGas}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById(idSergioGas)?.click();
                }
              }}
              className="apple-press w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-teal-600/90 hover:bg-teal-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-900/20"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando Demonstrativo Gás...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadStatus.sergioGas.carregado ? 'Substituir Demonstrativo Gás' : 'Carregar Demonstrativo Gás (.xlsx)'}</span>
                </>
              )}
            </label>

            {(uploadStatus.sergioAgua.carregado || uploadStatus.sergioGas.carregado) && (
              <button
                type="button"
                onClick={onIrParaConciliacao}
                className="apple-press w-full py-1.5 px-3 rounded-lg text-xs font-medium text-teal-300 hover:text-teal-200 bg-teal-950/40 border border-teal-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ver Conciliação de Gás</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
