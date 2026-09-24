// components/dashboard/UploadDropzone.tsx
import React, { useId, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

interface UploadDropzoneProps {
  isUploading: boolean;
  onUploadSergio: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onIrParaConciliacao: () => void;
  temDadosCarregados: boolean;
}

export function UploadDropzone({
  isUploading,
  onUploadSergio,
  onIrParaConciliacao,
  temDadosCarregados
}: UploadDropzoneProps) {
  const [isDraggingSergio, setIsDraggingSergio] = useState(false);
  const inputLeiturasId = useId();
  const inputSergioId = useId();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Planilha de Leituras Mensais */}
      <GlassCard className="p-8 flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-sky-500/30 transition-all">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 mb-4 group-hover:scale-105 transition-transform duration-200">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="font-semibold text-white text-base">Planilha de Leituras Mensais</h3>
          <p className="text-xs text-slate-300 mt-2 max-w-sm leading-relaxed">
            Importação dos dados brutos de hidrômetros e gás canalizado das Torres A a H (Leitura Anterior vs. Atual).
          </p>
        </div>

        <div className="w-full mt-6">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            id={inputLeiturasId}
            className="sr-only"
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
            className="apple-press w-full py-3 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-sky-400" />
            <span>Selecionar Leituras (.xlsx)</span>
          </label>
        </div>
      </GlassCard>

      {/* 2. Planilha do Sérgio (Conta Justa / Sabesp) */}
      <GlassCard 
        className={`p-8 flex flex-col items-center justify-between text-center relative overflow-hidden group transition-all ${
          isDraggingSergio 
            ? 'border-emerald-400 bg-emerald-950/20' 
            : 'hover:border-emerald-500/30'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingSergio(true); }}
        onDragLeave={() => setIsDraggingSergio(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingSergio(false);
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const input = document.getElementById(inputSergioId) as HTMLInputElement;
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }}
      >
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform duration-200">
            <FileSpreadsheet className="w-7 h-7" />
          </div>

          <h3 className="font-semibold text-white text-base">Planilha do Sérgio (Conta Justa)</h3>
          <p className="text-xs text-slate-300 mt-2 max-w-sm leading-relaxed">
            Conciliação matemática automática contra a tabela Sabesp 2026. Identifica inconsistências e desvios de centavos.
          </p>
        </div>

        <div className="w-full mt-6 space-y-2.5">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            id={inputSergioId}
            className="sr-only"
            disabled={isUploading}
            onChange={onUploadSergio}
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
            className="apple-press w-full py-3 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando Planilha com Sabesp 2026...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Carregar e Conciliar Folha Sérgio</span>
              </>
            )}
          </label>

          {temDadosCarregados && !isUploading && (
            <button
              type="button"
              onClick={onIrParaConciliacao}
              className="apple-press w-full py-2 px-3 rounded-lg text-xs font-medium text-emerald-300 hover:text-emerald-200 bg-emerald-950/40 border border-emerald-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ver resultados da conciliação</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
