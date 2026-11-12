// components/dashboard/CicloMetadadosBar.tsx
import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Calendar, Clock } from 'lucide-react';
import { CicloFechamento } from '@/lib/acquaPlayEngine';

interface CicloMetadadosBarProps {
  ciclo: CicloFechamento;
  onAtualizarCiclo: (campo: keyof CicloFechamento, valor: string) => void;
}

export function CicloMetadadosBar({
  ciclo,
  onAtualizarCiclo
}: CicloMetadadosBarProps) {
  return (
    <GlassCard className="p-3.5 mb-6">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        {/* Título / Contexto do Ciclo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 block">
              Parâmetros do Fechamento
            </span>
            <span className="font-semibold text-white text-xs">
              Ciclo Mensal de Medições
            </span>
          </div>
        </div>

        {/* Inputs de Data do Ciclo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 lg:max-w-3xl">
          {/* Mês Referência */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 focus-within:border-sky-500/60 transition">
            <label className="text-[10px] text-slate-400 uppercase font-medium block">
              Mês de Referência
            </label>
            <input
              type="text"
              value={ciclo.mesReferencia}
              onChange={(e) => onAtualizarCiclo('mesReferencia', e.target.value)}
              placeholder="ex: Outubro/2026"
              className="w-full bg-transparent text-slate-100 font-semibold text-xs focus:outline-none"
            />
          </div>

          {/* Leitura Anterior */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 focus-within:border-sky-500/60 transition">
            <label className="text-[10px] text-slate-400 uppercase font-medium block">
              Leitura Anterior
            </label>
            <input
              type="text"
              value={ciclo.dataLeituraAnterior}
              onChange={(e) => onAtualizarCiclo('dataLeituraAnterior', e.target.value)}
              placeholder="ex: 15/09/2026"
              className="w-full bg-transparent text-slate-100 font-mono text-xs focus:outline-none"
            />
          </div>

          {/* Leitura Atual */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 focus-within:border-sky-500/60 transition">
            <label className="text-[10px] text-slate-400 uppercase font-medium block">
              Leitura Atual
            </label>
            <input
              type="text"
              value={ciclo.dataLeituraAtual}
              onChange={(e) => onAtualizarCiclo('dataLeituraAtual', e.target.value)}
              placeholder="ex: 15/10/2026"
              className="w-full bg-transparent text-emerald-400 font-mono font-semibold text-xs focus:outline-none"
            />
          </div>

          {/* Próxima Leitura */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 focus-within:border-sky-500/60 transition">
            <label className="text-[10px] text-slate-400 uppercase font-medium block">
              Próxima Leitura
            </label>
            <input
              type="text"
              value={ciclo.dataProximaLeitura}
              onChange={(e) => onAtualizarCiclo('dataProximaLeitura', e.target.value)}
              placeholder="ex: 15/11/2026"
              className="w-full bg-transparent text-amber-400 font-mono text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Status Indicativo */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>Alimenta o cabeçalho do Extrato .xlsx</span>
        </div>
      </div>
    </GlassCard>
  );
}
