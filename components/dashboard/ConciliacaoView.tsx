// components/dashboard/ConciliacaoView.tsx
import React, { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Clipboard, 
  Check, 
  TrendingUp, 
  MinusCircle, 
  AlertTriangle 
} from 'lucide-react';
import { ItemConciliacao, formatarMoedaBRL, formatarM3 } from '@/lib/acquaPlayEngine';

type FiltroStatus = 'TODOS' | 'VERDADEIRO' | 'FALSO' | 'NEGATIVO' | 'ALTO' | 'BAIXO_QUASE_ZERO';

interface ConciliacaoViewProps {
  dados: ItemConciliacao[];
  onExportarExcel: () => void;
  onCopiarRelatorioSergio?: () => void;
}

export function ConciliacaoView({ 
  dados, 
  onExportarExcel,
  onCopiarRelatorioSergio 
}: ConciliacaoViewProps) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODOS');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [copiado, setCopiado] = useState(false);
  const ITENS_POR_PAGINA = 50;

  const contagens = useMemo(() => {
    return {
      divergencias: dados.filter(d => d.status === 'FALSO').length,
      negativos: dados.filter(d => d.tipoAnomalia === 'NEGATIVO' || d.consumo < 0).length,
      altos: dados.filter(d => d.tipoAnomalia === 'ALTO').length,
      baixos: dados.filter(d => d.tipoAnomalia === 'BAIXO_QUASE_ZERO').length,
      aprovados: dados.filter(d => d.status === 'VERDADEIRO').length
    };
  }, [dados]);

  const dadosFiltrados = useMemo(() => {
    return dados.filter(item => {
      let matchStatus = true;
      if (filtroStatus === 'VERDADEIRO') matchStatus = item.status === 'VERDADEIRO';
      else if (filtroStatus === 'FALSO') matchStatus = item.status === 'FALSO';
      else if (filtroStatus === 'NEGATIVO') matchStatus = item.tipoAnomalia === 'NEGATIVO' || item.consumo < 0;
      else if (filtroStatus === 'ALTO') matchStatus = item.tipoAnomalia === 'ALTO';
      else if (filtroStatus === 'BAIXO_QUASE_ZERO') matchStatus = item.tipoAnomalia === 'BAIXO_QUASE_ZERO';

      const matchBusca = busca.trim() === '' || 
        item.unidade.toLowerCase().includes(busca.toLowerCase());
      return matchStatus && matchBusca;
    });
  }, [dados, filtroStatus, busca]);

  const totalPaginas = Math.max(1, Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA));
  const dadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return dadosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [dadosFiltrados, paginaAtual]);

  const handleCopiar = () => {
    if (onCopiarRelatorioSergio) {
      onCopiarRelatorioSergio();
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const opcoesFiltro: { id: FiltroStatus; label: string; icon: React.ElementType | null; color?: string; badge?: number }[] = [
    { id: 'TODOS', label: 'Todos', icon: null, badge: dados.length },
    { id: 'VERDADEIRO', label: 'Aprovados', icon: CheckCircle2, color: 'text-emerald-400', badge: contagens.aprovados },
    { id: 'FALSO', label: 'Divergências', icon: XCircle, color: 'text-rose-400', badge: contagens.divergencias },
    { id: 'NEGATIVO', label: 'Negativos', icon: MinusCircle, color: 'text-amber-400', badge: contagens.negativos },
    { id: 'ALTO', label: 'Altos', icon: TrendingUp, color: 'text-sky-400', badge: contagens.altos }
  ];

  return (
    <div className="space-y-4">
      {/* Barra de Controles e Filtros */}
      <GlassCard className="p-3.5 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
            placeholder="Buscar por unidade (ex: Torre A, 0031)..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtros RÁPIDOS */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-x-auto">
            {opcoesFiltro.map(f => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { setFiltroStatus(f.id); setPaginaAtual(1); }}
                  className={`apple-press px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    filtroStatus === f.id
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${f.color}`} />}
                  <span>{f.label}</span>
                  {f.badge !== undefined && f.badge > 0 && (
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-900 text-slate-300">
                      {f.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Botão Copiar Relatório Sérgio */}
          {onCopiarRelatorioSergio && (
            <button
              type="button"
              onClick={handleCopiar}
              className="apple-press px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
              title="Gera o texto com as divergências e negativos pronto para colar no WhatsApp ou Word do Sérgio"
            >
              {copiado ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Relatório do Sérgio</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onExportarExcel}
            className="apple-press px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Exportar .xlsx</span>
          </button>
        </div>
      </GlassCard>

      {/* Alerta de Consumos Negativos (Troca de Cyble) */}
      {contagens.negativos > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Atenção operacional (Notion):</strong> Foram detectadas {contagens.negativos} unidades com consumo negativo. Conforme regra do condomínio, aplique o retroativo do medidor antigo e reinicie a contagem do novo medidor a partir do 0.
          </span>
        </div>
      )}

      {/* Tabela de Dados */}
      <GlassCard className="overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-300 uppercase border-b border-slate-800/80 font-sans sticky top-0 z-10 tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="p-3.5">Unidade / Apto</th>
                <th scope="col" className="p-3.5 text-right">Consumo Sabesp</th>
                <th scope="col" className="p-3.5 text-right">Cálculo Hydrojexe</th>
                <th scope="col" className="p-3.5 text-right">Folha Sérgio</th>
                <th scope="col" className="p-3.5 text-right">Diferença</th>
                <th scope="col" className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {dadosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-sans">
                    Nenhum apartamento encontrado para os critérios de busca.
                  </td>
                </tr>
              ) : (
                dadosPaginados.map((item, idx) => {
                  const isDivergente = item.status === 'FALSO';
                  const isNegativo = item.tipoAnomalia === 'NEGATIVO' || item.consumo < 0;

                  return (
                    <tr 
                      key={`${item.unidade}-${idx}`}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isDivergente ? 'bg-rose-500/5' : isNegativo ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-3.5 font-sans font-medium text-slate-200">
                        <div>{item.unidade}</div>
                        {item.observacao && (
                          <div className="text-[10px] text-slate-400 font-sans truncate max-w-xs" title={item.observacao}>
                            {item.observacao}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right text-slate-300">
                        {formatarM3(item.consumo)} m³
                      </td>
                      <td className="p-3.5 text-right text-slate-300 font-semibold">
                        {formatarMoedaBRL(item.valorHydrojexe)}
                      </td>
                      <td className="p-3.5 text-right text-slate-300">
                        {formatarMoedaBRL(item.valorSergio)}
                      </td>
                      <td className={`p-3.5 text-right font-medium ${
                        isDivergente ? 'text-rose-400 font-semibold' : 'text-slate-400'
                      }`}>
                        {item.diferenca === 0 ? '—' : (item.diferenca > 0 ? '+' : '') + formatarMoedaBRL(item.diferenca)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold border ${
                          isDivergente 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : isNegativo
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isDivergente ? <XCircle className="w-3 h-3" /> : isNegativo ? <MinusCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'VERDADEIRO' ? 'VERDADEIRO' : isNegativo ? 'NEGATIVO' : 'FALSO'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Rodapé da Tabela */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-400 font-sans flex flex-col sm:flex-row justify-between items-center gap-2">
           <span>Total Aprovados: {contagens.aprovados} | Divergências: {contagens.divergencias} | Negativos: {contagens.negativos}</span>
           <span>Página {paginaAtual} de {totalPaginas}</span>
        </div>
      </GlassCard>
    </div>
  );
}
