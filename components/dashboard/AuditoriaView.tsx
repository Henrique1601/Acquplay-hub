// components/dashboard/AuditoriaView.tsx
import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertTriangle, RefreshCw, Check, Droplets, Flame } from 'lucide-react';
import { formatarM3 } from '@/lib/acquaPlayEngine';

export interface CasoAuditoriaItem {
  id: string;
  unidade: string;
  consumoAgua: number;
  consumoGas: number;
  motivo: string;
  confirmado: boolean;
  observacao: string;
}

interface AuditoriaViewProps {
  casos: CasoAuditoriaItem[];
  onToggleConfirmacao: (id: string) => void;
}

export function AuditoriaView({ casos, onToggleConfirmacao }: AuditoriaViewProps) {
  const confirmadosCount = casos.filter(c => c.confirmado).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Contexto da Auditoria */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Regra 3:1 de Detecção de Anomalias</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Auditoria Cruzada Água x Gás &amp; Consumos Retroativos
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Apartamentos que apresentaram medições atípicas (ex: água ativa sem consumo de gás, gás ativo sem água, ou disparidade acima de 3 vezes), bem como hidrômetros trocados com consumo acumulado.
            </p>
          </div>

          <div className="bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800 text-right shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Vistorias Processadas
            </span>
            <span className="text-xl font-bold text-white font-mono mt-0.5 block">
              {confirmadosCount} / {casos.length}
            </span>
          </div>
        </div>

        {/* Lista de Casos */}
        <div className="mt-6 space-y-3.5">
          {casos.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.confirmado
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-white text-sm">
                      {item.unidade}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20">
                      <Droplets className="w-3 h-3 text-sky-400" />
                      Água: {formatarM3(item.consumoAgua)} m³
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      <Flame className="w-3 h-3 text-amber-400" />
                      Gás: {formatarM3(item.consumoGas)} m³
                    </span>
                  </div>

                  <p className="text-xs text-amber-300 font-medium">
                    {item.motivo}
                  </p>

                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">Parecer Técnico:</strong> {item.observacao}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleConfirmacao(item.id)}
                  className={`apple-press px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-2 shrink-0 ${
                    item.confirmado
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                      : 'bg-sky-600/20 text-sky-300 border-sky-500/30 hover:bg-sky-600/30'
                  }`}
                >
                  {item.confirmado ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Vistoria Confirmada</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-sky-400" />
                      <span>Confirmar Vistoria / Retroativo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
