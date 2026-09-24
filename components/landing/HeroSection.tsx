// components/landing/HeroSection.tsx
import React from 'react';
import { Download, ChevronDown, ShieldCheck, Waves, Maximize2, Minimize2 } from 'lucide-react';

interface HeroSectionProps {
  modoFoco: boolean;
  onToggleModoFoco: () => void;
  onExportarExcel: () => void;
  onRolarParaConsole: () => void;
}

export function HeroSection({
  modoFoco,
  onToggleModoFoco,
  onExportarExcel,
  onRolarParaConsole
}: HeroSectionProps) {
  if (modoFoco) {
    return (
      <header className="flex justify-between items-center py-3 px-4 glass-panel rounded-xl mb-6 transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">
              AcquaPlay Home &amp; Resort <span className="text-slate-400 font-normal">| Console Operacional</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleModoFoco}
            className="apple-press px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer"
            title="Expandir Apresentação"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expandir Hero</span>
          </button>

          <button
            type="button"
            onClick={onExportarExcel}
            className="apple-press px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Extrato .xlsx</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <section className="relative pt-6 pb-10 border-b border-slate-800/60 mb-8 overflow-hidden">
      {/* Luz ambiente de profundidade Apple (restrita e elegante) */}
      <div 
        aria-hidden="true" 
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[280px] bg-gradient-to-b from-sky-500/10 via-sky-600/5 to-transparent blur-3xl pointer-events-none rounded-full"
      />

      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-3xl space-y-3">
          {/* Tag de Marca Hydrojexe com Selo */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-sky-950/60 border border-sky-400/20 text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="font-semibold tracking-wide uppercase text-[11px]">Hydrojexe Individualizações</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              Auditoria de Precisão 2026
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            AcquaPlay Home &amp; Resort
          </h1>

          <p className="text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
            Plataforma centralizada de automação hidrométrica, rateio de gás canalizado (Comgás) 
            e conciliação contábil Sabesp para as <strong className="text-white font-semibold">1.435 unidades residenciais</strong> distribuídas nas 8 torres.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Santos — Ponta da Praia
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              8 Torres (A até H)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              16 Medidores Mestres Ativos
            </span>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onToggleModoFoco}
            className="apple-press px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Modo Foco</span>
          </button>

          <button
            type="button"
            onClick={onExportarExcel}
            className="apple-press px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Exportar Extrato (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={onRolarParaConsole}
            className="apple-press px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
          >
            <span>Operar Fechamento</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
