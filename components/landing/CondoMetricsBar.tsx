// components/landing/CondoMetricsBar.tsx
import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Building2, Flame, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatarMoedaBRL, formatarM3 } from '@/lib/acquaPlayEngine';

interface CondoMetricsBarProps {
  totalUnidades: number;
  totalRsGas: number;
  totalM3Gas: number;
  tarifaFormatadaGas: string;
  tarifaPrecisaGas: number;
  divergenciasCount: number;
  aprovadosCount: number;
  vistoriasCount: number;
}

export function CondoMetricsBar({
  totalUnidades,
  totalRsGas,
  totalM3Gas,
  tarifaFormatadaGas,
  tarifaPrecisaGas,
  divergenciasCount,
  aprovadosCount,
  vistoriasCount
}: CondoMetricsBarProps) {
  const taxaAprovacao = totalUnidades > 0 
    ? Math.round((aprovadosCount / totalUnidades) * 100)
    : 100;

  return (
    <section aria-label="Indicadores Chave do Condomínio" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Total de Unidades */}
      <GlassCard className="p-4 flex flex-col justify-between transition-all hover:border-slate-700/80">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Unidades Condomínio</span>
            <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalUnidades.toLocaleString('pt-BR')}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>8 Torres Residenciais</span>
          <span className="font-medium text-slate-300">Torres A a H</span>
        </div>
      </GlassCard>

      {/* 2. Tarifa Comgás (Gás Canalizado) */}
      <GlassCard className="p-4 flex flex-col justify-between transition-all hover:border-slate-700/80">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tarifa Gás (Comgás)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              R$ {tarifaFormatadaGas}
            </span>
            <span className="text-xs text-slate-400 font-sans">/ m³</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono">{formatarM3(totalM3Gas, 0)} m³ faturados</span>
          <span className="font-semibold text-slate-200 font-mono" title={`Tarifa exata: R$ ${tarifaPrecisaGas.toFixed(4)}`}>
            {formatarMoedaBRL(totalRsGas)}
          </span>
        </div>
      </GlassCard>

      {/* 3. Conciliação Sabesp */}
      <GlassCard className="p-4 flex flex-col justify-between transition-all hover:border-slate-700/80">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Conciliação Sabesp</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {divergenciasCount}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
              {divergenciasCount === 1 ? '1 Divergência' : `${divergenciasCount} Divergências`}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            {aprovadosCount} Aprovados
          </span>
          <span className="font-medium text-slate-300">{taxaAprovacao}% Conformidade</span>
        </div>
      </GlassCard>

      {/* 4. Vistorias Cruzadas (3:1) */}
      <GlassCard className="p-4 flex flex-col justify-between transition-all hover:border-slate-700/80">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Vistorias (Regra 3:1)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {vistoriasCount}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Disparidade Água x Gás</span>
          <span className="text-amber-400 font-medium">Requer Atenção</span>
        </div>
      </GlassCard>
    </section>
  );
}
