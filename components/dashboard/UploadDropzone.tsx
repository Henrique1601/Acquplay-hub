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
  sergio: { carregado: boolean; nomeArquivo?: string; total?: number };
}

interface UploadDropzoneProps {
  isUploading: boolean;
  uploadStatus: UploadStatusState;
  onUploadAgua: (file: File) => Promise<void>;
  onUploadGasIndividual: (file: File) => Promise<void>;
  onUploadComgas: (file: File) => Promise<void>;
  onUploadSergio: (file: File) => Promise<void>;
  onIrParaConciliacao: () => void;
  onIrParaComgas: () => void;
}

export function UploadDropzone({
  isUploading,
  uploadStatus,
  onUploadAgua,
  onUploadGasIndividual,
  onUploadComgas,
  onUploadSergio,
  onIrParaConciliacao,
  onIrParaComgas
}: UploadDropzoneProps) {
  const [dragCard, setDragCard] = useState<string | null>(null);

  const idAgua = useId();
  const idGasInd = useId();
  const idComgas = useId();
  const idSergio = useId();

  const handleDrop = (e: React.DragEvent, uploadFn: (file: File) => Promise<void>) => {
    e.preventDefault();
    setDragCard(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFn(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, uploadFn: (file: File) => Promise<void>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFn(file);
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
              1. Medições de Água (Individual)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Planilha de leitura dos 1.435 hidrômetros (Leitura Anterior, Atual e Consumo m³). Calcula automaticamente pela tabela Sabesp 2026.
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
              2. Medições de Gás (Individual)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Planilha de leitura dos gasômetros individuais dos apartamentos. Identifica trocas físicas de medidor (cyble) e calcula o consumo m³ por torre.
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

        {/* 3. Contas Comgás dos 16 Medidores Mestres (1º Andar) */}
        <GlassCard 
          className={`p-6 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200 ${
            dragCard === 'comgas' ? 'border-violet-400 bg-violet-950/20' : 'hover:border-violet-500/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragCard('comgas'); }}
          onDragLeave={() => setDragCard(null)}
          onDrop={(e) => handleDrop(e, onUploadComgas)}
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
                  16 Medidores Mestres
                </span>
              )}
            </div>

            <h3 className="font-semibold text-white text-base">
              3. Contas Comgás (16 Medidores Mestres)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Faturas dos 16 medidores do 1º andar. Determina a tarifa exata por medidor e por torre dividindo o <strong>Preço ÷ Consumo (Volume)</strong>.
            </p>

            {uploadStatus.comgas.nomeArquivo && (
              <p className="text-[11px] font-mono text-violet-300/80 mt-3 truncate flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                <span className="truncate">{uploadStatus.comgas.nomeArquivo}</span>
              </p>
            )}
          </div>

          <div className="w-full mt-6 space-y-2">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id={idComgas}
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => handleChange(e, onUploadComgas)}
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
                  <span>{uploadStatus.comgas.carregado ? 'Substituir Contas Comgás' : 'Carregar Contas Comgás (.xlsx)'}</span>
                </>
              )}
            </label>

            {uploadStatus.comgas.carregado && (
              <button
                type="button"
                onClick={onIrParaComgas}
                className="apple-press w-full py-1.5 px-3 rounded-lg text-xs font-medium text-violet-300 hover:text-violet-200 bg-violet-950/40 border border-violet-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ver cálculo detalhado dos 16 medidores</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </GlassCard>

        {/* 4. Folha do Sérgio (Conta Justa) */}
        <GlassCard 
          className={`p-6 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200 ${
            dragCard === 'sergio' ? 'border-emerald-400 bg-emerald-950/20' : 'hover:border-emerald-500/40'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragCard('sergio'); }}
          onDragLeave={() => setDragCard(null)}
          onDrop={(e) => handleDrop(e, onUploadSergio)}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                <Scale className="w-6 h-6" />
              </div>
              {uploadStatus.sergio.carregado ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {uploadStatus.sergio.total} unidades conciliadas
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  Conta Justa / Cobrança
                </span>
              )}
            </div>

            <h3 className="font-semibold text-white text-base">
              4. Folha do Sérgio (Conta Justa)
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Planilha do Sérgio para auditoria matemática. Detecta divergências de centavos e complementa a cobrança de gás caso a folha venha zerada.
            </p>

            {uploadStatus.sergio.nomeArquivo && (
              <p className="text-[11px] font-mono text-emerald-300/80 mt-3 truncate flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">{uploadStatus.sergio.nomeArquivo}</span>
              </p>
            )}
          </div>

          <div className="w-full mt-6 space-y-2">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id={idSergio}
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => handleChange(e, onUploadSergio)}
            />
            <label
              htmlFor={idSergio}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById(idSergio)?.click();
                }
              }}
              className="apple-press w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/20"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Conciliando Folha do Sérgio...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadStatus.sergio.carregado ? 'Substituir Folha do Sérgio' : 'Carregar e Conciliar Folha Sérgio'}</span>
                </>
              )}
            </label>

            {uploadStatus.sergio.carregado && (
              <button
                type="button"
                onClick={onIrParaConciliacao}
                className="apple-press w-full py-1.5 px-3 rounded-lg text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 border border-emerald-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Ver tabela de conciliação</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
