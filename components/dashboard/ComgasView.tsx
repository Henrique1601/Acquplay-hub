// components/dashboard/ComgasView.tsx
import React, { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Flame, Calculator, ShieldCheck, Gauge, Layers } from 'lucide-react';
import { formatarMoedaBRL, formatarM3, extrairTorre } from '@/lib/acquaPlayEngine';

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
  tarifasPorTorre?: Record<string, number>;
  onAtualizarManutencao: (valor: number) => void;
}

export function ComgasView({
  contas,
  tarifaFormatada,
  tarifaPrecisa,
  totalRs,
  totalM3,
  tarifasPorTorre = {},
  onAtualizarManutencao
}: ComgasViewProps) {
  const [filtroTorre, setFiltroTorre] = useState<string>('TODAS');
  const [manutencaoInput, setManutencaoInput] = useState('0');

  const torres = ['TODAS', 'TORRE A', 'TORRE B', 'TORRE C', 'TORRE D', 'TORRE E', 'TORRE F', 'TORRE G', 'TORRE H'];

  const contasFiltradas = contas.filter(c => {
    if (filtroTorre === 'TODAS') return true;
    return c.bloco.toUpperCase().includes(filtroTorre);
  });

  const handleManutencaoChange = (val: string) => {
    setManutencaoInput(val);
    const num = parseFloat(val) || 0;
    onAtualizarManutencao(num);
  };

  // Consolidação por Torre
  const resumoTorres = useMemo(() => {
    const mapa: Record<string, { totalRs: number; totalM3: number; medidores: number }> = {};
    for (const t of ['TORRE A', 'TORRE B', 'TORRE C', 'TORRE D', 'TORRE E', 'TORRE F', 'TORRE G', 'TORRE H']) {
      mapa[t] = { totalRs: 0, totalM3: 0, medidores: 0 };
    }

    contas.forEach(c => {
      const torre = extrairTorre(c.bloco);
      if (!mapa[torre]) mapa[torre] = { totalRs: 0, totalM3: 0, medidores: 0 };
      mapa[torre].totalRs += c.valorRs || 0;
      mapa[torre].totalM3 += c.volumeM3 || 0;
      mapa[torre].medidores += 1;
    });

    return Object.entries(mapa).map(([torre, dados]) => {
      const tarifaCalc = dados.totalM3 > 0 ? dados.totalRs / dados.totalM3 : 0;
      const tarifaFinal = tarifasPorTorre[torre] !== undefined ? tarifasPorTorre[torre] : tarifaCalc;
      return {
        torre,
        totalRs: dados.totalRs,
        totalM3: dados.totalM3,
        medidores: dados.medidores,
        tarifa: tarifaFinal
      };
    });
  }, [contas, tarifasPorTorre]);

  return (
    <div className="space-y-6">
      {/* Banner de Cálculo da Tarifa Mestre */}
      <GlassCard variant="elevated" className="p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Comgás Gás Natural Canalizado • 1º Andar</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Tarifa por Medidor &amp; Torre: Preço ÷ Volume de Cada Medidor
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              No AcquaPlay, a tarifa de cada medidor do 1º andar é obtida dividindo o <strong>valor da conta pelo consumo (m³)</strong> daquele medidor. Os apartamentos de cada torre pagam exatamente o consumo individual multiplicado pela tarifa da sua torre.
            </p>
          </div>

          {/* Destaque Numérico da Tarifa Geral */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center gap-6 shrink-0">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Tarifa Média Geral (Rateio Líquido)
              </span>
              <div className="text-3xl font-extrabold text-amber-400 font-mono mt-0.5">
                R$ {tarifaFormatada} <span className="text-xs text-slate-400 font-normal">/ m³</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Precisão: R$ {tarifaPrecisa.toFixed(4)} / m³
              </span>
            </div>

            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Resumo da Equação + Campo de Manutenção */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Soma das Faturas (Bruto)</span>
            <span className="text-base font-bold text-slate-100 font-mono mt-0.5 block">
              {formatarMoedaBRL(totalRs)}
            </span>
          </div>

          <div className="focus-within:ring-2 focus-within:ring-amber-500/50 rounded-xl transition">
            <label className="text-slate-400 block text-[11px] uppercase tracking-wider mb-0.5">
              Expurgar Manutenção (R$)
            </label>
            <input
              type="number"
              value={manutencaoInput}
              onChange={(e) => handleManutencaoChange(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 w-full text-amber-400 font-mono font-bold"
            />
            <span className="flex items-center gap-1 text-[10px] text-amber-600/80 mt-1">
              <ShieldCheck className="w-3 h-3" /> Expurga taxas extras do condomínio
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Volume Total Faturado</span>
            <span className="text-base font-bold text-slate-100 font-mono mt-0.5 block">
              {formatarM3(totalM3, 0)} m³
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Fórmula por Medidor</span>
            <span className="text-xs text-amber-300 font-mono mt-1 block">
              Tarifa = Preço Medidor ÷ Volume m³
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Tabela de Tarifas por Torre (A a H) */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-white">Tarifas Consolidadas por Torre (Torres A a H)</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {resumoTorres.map(t => (
            <div key={t.torre} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <span className="text-xs font-bold text-slate-200 block">{t.torre.replace('TORRE ', 'Torre ')}</span>
              <span className="text-sm font-mono font-extrabold text-amber-400 mt-1 block">
                R$ {t.tarifa.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                {t.tarifa.toFixed(4)}/m³
              </span>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {formatarM3(t.totalM3, 0)} m³
              </span>
            </div>
          ))}
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

      {/* Grid com os 16 Medidores Mestres com cálculo Preço ÷ Volume */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contasFiltradas.map((conta, idx) => {
          const tarifaMedidor = conta.volumeM3 > 0 ? conta.valorRs / conta.volumeM3 : 0;

          return (
            <GlassCard key={idx} className="p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-white font-sans">
                      {conta.bloco}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Conta Contrato Comgás: {conta.codigo}
                  </p>
                </div>

                {/* Tarifa do Medidor Calculada */}
                <div className="text-right bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                    Tarifa Medidor
                  </span>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    R$ {tarifaMedidor.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    (R$ {tarifaMedidor.toFixed(4)}/m³)
                  </span>
                </div>
              </div>

              {/* Linha com Preço e Volume */}
              <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Consumo (Volume)</span>
                  <span className="text-slate-200 font-medium">{formatarM3(conta.volumeM3, 0)} m³</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase text-right">Preço da Fatura</span>
                  <span className="text-amber-400 font-bold text-right block">{formatarMoedaBRL(conta.valorRs)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">Cálculo</span>
                  <span className="text-slate-300 text-[11px]">{conta.valorRs.toFixed(2)} ÷ {conta.volumeM3}</span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
