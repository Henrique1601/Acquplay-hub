// components/dashboard/ComgasView.tsx
import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Flame, Calculator } from 'lucide-react';
import { formatarMoedaBRL, formatarM3 } from '@/lib/acquaPlayEngine';

export interface ContaComgasItem {
  codigo: string;
  bloco: string;
  valorRs: number;
  volumeM3: number;
}

interface ComgasViewProps {
  contas: ContaComgasItem[];
  tarifaFormatada: string;
  tarifaPrecisa: number;
  totalRs: number;
  totalM3: number;
}

export function ComgasView({
  contas,
  tarifaFormatada,
  tarifaPrecisa,
  totalRs,
  totalM3
}: ComgasViewProps) {
  const [filtroTorre, setFiltroTorre] = useState<string>('TODAS');

  const torres = ['TODAS', 'TORRE A', 'TORRE B', 'TORRE C', 'TORRE D', 'TORRE E', 'TORRE F', 'TORRE G', 'TORRE H'];

  const contasFiltradas = contas.filter(c => {
    if (filtroTorre === 'TODAS') return true;
    return c.bloco.toUpperCase().includes(filtroTorre);
  });

  return (
    <div className="space-y-6">
      {/* Banner de Cálculo da Tarifa Mestre */}
      <GlassCard variant="elevated" className="p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Comgás Gás Natural Canalizado</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Fórmula de Rateio do Condomínio (16 Medidores)
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              A tarifa aplicada às 1.435 unidades é calculada pela divisão exata da soma total das faturas dos medidores mestres pelo volume total em metros cúbicos medido pela concessionária.
            </p>
          </div>

          {/* Destaque Numérico da Tarifa */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center gap-6 shrink-0">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Tarifa Unitária de Rateio
              </span>
              <div className="text-3xl font-extrabold text-amber-400 font-mono mt-0.5">
                R$ {tarifaFormatada} <span className="text-xs text-slate-400 font-normal">/ m³</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Precisão contábil: R$ {tarifaPrecisa.toFixed(4)}
              </span>
            </div>

            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Resumo da Equação */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Soma das Faturas (16 Medidores)</span>
            <span className="text-base font-bold text-slate-100 font-mono mt-0.5 block">
              {formatarMoedaBRL(totalRs)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Volume Total Faturado</span>
            <span className="text-base font-bold text-slate-100 font-mono mt-0.5 block">
              {formatarM3(totalM3, 0)} m³
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Equação Contábil</span>
            <span className="text-xs text-slate-300 font-mono mt-1 block">
              {formatarMoedaBRL(totalRs)} ÷ {formatarM3(totalM3, 0)} m³ = R$ {tarifaFormatada}/m³
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Filtros por Torre */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {torres.map(torre => (
          <button
            key={torre}
            type="button"
            onClick={() => setFiltroTorre(torre)}
            className={`apple-press px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              filtroTorre === torre
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-400/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            {torre}
          </button>
        ))}
      </div>

      {/* Grid com os 16 Medidores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {contasFiltradas.map((conta, idx) => (
          <GlassCard key={idx} className="p-4 flex items-center justify-between hover:border-slate-700/80 transition-all">
            <div className="space-y-1">
              <span className="text-sm font-semibold text-white font-sans">
                {conta.bloco}
              </span>
              <p className="text-[11px] text-slate-400 font-mono">
                Conta Contrato Comgás: {conta.codigo}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-300 font-mono block">
                {formatarM3(conta.volumeM3, 0)} m³
              </span>
              <span className="text-sm font-bold text-amber-400 font-mono block mt-0.5">
                {formatarMoedaBRL(conta.valorRs)}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
