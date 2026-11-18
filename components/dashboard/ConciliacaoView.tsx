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
  AlertTriangle,
  Droplets,
  Flame,
  Layers,
  HelpCircle
} from 'lucide-react';
import { ItemConciliacao, formatarMoedaBRL, formatarM3 } from '@/lib/acquaPlayEngine';

type FiltroStatus = 'TODOS' | 'VERDADEIRO' | 'FALSO' | 'NEGATIVO' | 'ALTO' | 'GAS_ZERADO';
type ModoVisualizacao = 'CONSOLIDADO' | 'AGUA' | 'GAS';

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
  const [modoVis, setModoVis] = useState<ModoVisualizacao>('CONSOLIDADO');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [copiado, setCopiado] = useState(false);
  const ITENS_POR_PAGINA = 50;

  const contagens = useMemo(() => {
    return {
      divergencias: dados.filter(d => d.status === 'FALSO').length,
      negativos: dados.filter(d => d.tipoAnomalia === 'NEGATIVO' || d.consumo < 0).length,
      altos: dados.filter(d => d.tipoAnomalia === 'ALTO').length,
      gasZerado: dados.filter(d => d.statusGas === 'SERGIO_ZERADO' || (d.consumoGas && d.consumoGas > 0 && (!d.valorGasSergio || d.valorGasSergio === 0))).length,
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
      else if (filtroStatus === 'GAS_ZERADO') matchStatus = item.statusGas === 'SERGIO_ZERADO' || Boolean(item.consumoGas && item.consumoGas > 0 && (!item.valorGasSergio || item.valorGasSergio === 0));

      const matchBusca = busca.trim() === '' || 
        item.unidade.toLowerCase().includes(busca.toLowerCase()) ||
        (item.torre && item.torre.toLowerCase().includes(busca.toLowerCase()));
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
    { id: 'FALSO', label: 'Divergências Sabesp', icon: XCircle, color: 'text-rose-400', badge: contagens.divergencias },
    { id: 'GAS_ZERADO', label: 'Gás Zerado no Sérgio', icon: HelpCircle, color: 'text-amber-400', badge: contagens.gasZerado },
    { id: 'NEGATIVO', label: 'Negativos (Cyble)', icon: MinusCircle, color: 'text-amber-400', badge: contagens.negativos },
    { id: 'ALTO', label: 'Consumos Altos', icon: TrendingUp, color: 'text-sky-400', badge: contagens.altos }
  ];

  return (
    <div className="space-y-4">
      {/* Alerta de Gás Zerado na Folha do Sérgio */}
      {contagens.gasZerado > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-100">
              Folha do Sérgio com Gás Zerado ({contagens.gasZerado} unidades detectadas)
            </p>
            <p className="text-amber-300/80 leading-relaxed">
              Como o Sérgio não recebe a fatura Comgás diretamente, a folha vem sem a tarifa de gás calculada. O AcquaPlay Hub calculou a tarifa da torre correspondente (Preço da conta ÷ Consumo do medidor mestre) e atribuiu o valor correto a cada unidade.
            </p>
          </div>
        </div>
      )}

      {/* Barra de Controles e Filtros */}
      <GlassCard className="p-3.5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
              placeholder="Buscar por unidade ou torre (ex: Torre A, 0031)..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition"
            />
          </div>

          {/* Alternador de Modo de Visualização */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setModoVis('CONSOLIDADO')}
              className={`apple-press px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                modoVis === 'CONSOLIDADO' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Consolidado</span>
            </button>
            <button
              type="button"
              onClick={() => setModoVis('AGUA')}
              className={`apple-press px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                modoVis === 'AGUA' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>Água (Sabesp)</span>
            </button>
            <button
              type="button"
              onClick={() => setModoVis('GAS')}
              className={`apple-press px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                modoVis === 'GAS' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Gás (Comgás)</span>
            </button>
          </div>
        </div>

        {/* Linha de Filtros e Ações */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-x-auto gap-1">
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

          <div className="flex items-center gap-2">
            {onCopiarRelatorioSergio && (
              <button
                type="button"
                onClick={handleCopiar}
                className="apple-press px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                title="Gera o texto com as divergências pronto para o Sérgio"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Relatório Sérgio</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onExportarExcel}
              className="apple-press px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Exportar .xlsx</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Tabela de Dados */}
      <GlassCard className="overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-300 uppercase border-b border-slate-800/80 font-sans sticky top-0 z-10 tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="p-3.5">Unidade / Torre</th>
                
                {/* Colunas de Água */}
                {(modoVis === 'CONSOLIDADO' || modoVis === 'AGUA') && (
                  <>
                    <th scope="col" className="p-3.5 text-right">Água (m³)</th>
                    <th scope="col" className="p-3.5 text-right">Sabesp Hydrojexe</th>
                    <th scope="col" className="p-3.5 text-right">Água Sérgio</th>
                    <th scope="col" className="p-3.5 text-right">Diff Água</th>
                    <th scope="col" className="p-3.5 text-center">Status Água</th>
                  </>
                )}

                {/* Colunas de Gás */}
                {(modoVis === 'CONSOLIDADO' || modoVis === 'GAS') && (
                  <>
                    <th scope="col" className="p-3.5 text-right">Gás (m³)</th>
                    <th scope="col" className="p-3.5 text-right">Tarifa Torre</th>
                    <th scope="col" className="p-3.5 text-right">Gás Calculado</th>
                    <th scope="col" className="p-3.5 text-right">Gás Sérgio</th>
                    <th scope="col" className="p-3.5 text-center">Status Gás</th>
                  </>
                )}

                {/* Coluna Total */}
                {modoVis === 'CONSOLIDADO' && (
                  <th scope="col" className="p-3.5 text-right">Total Hydrojexe</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {dadosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 font-sans">
                    Nenhum apartamento encontrado para os critérios de busca.
                  </td>
                </tr>
              ) : (
                dadosPaginados.map((item, idx) => {
                  const isDivergente = item.status === 'FALSO';
                  const isNegativo = item.tipoAnomalia === 'NEGATIVO' || item.consumo < 0;
                  const isGasZerado = item.statusGas === 'SERGIO_ZERADO' || Boolean(item.consumoGas && item.consumoGas > 0 && (!item.valorGasSergio || item.valorGasSergio === 0));

                  return (
                    <tr 
                      key={`${item.unidade}-${idx}`}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isDivergente ? 'bg-rose-500/5' : isNegativo ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-3.5 font-sans font-medium text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{item.unidade}</span>
                          {item.torre && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {item.torre}
                            </span>
                          )}
                        </div>
                        {item.observacao && (
                          <div className="text-[10px] text-slate-400 font-sans truncate max-w-xs mt-0.5" title={item.observacao}>
                            {item.observacao}
                          </div>
                        )}
                      </td>

                      {/* Água */}
                      {(modoVis === 'CONSOLIDADO' || modoVis === 'AGUA') && (
                        <>
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
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${
                              isDivergente 
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                : isNegativo
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {isDivergente ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                              {item.status}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Gás */}
                      {(modoVis === 'CONSOLIDADO' || modoVis === 'GAS') && (
                        <>
                          <td className="p-3.5 text-right text-amber-300">
                            {item.consumoGas !== undefined ? `${formatarM3(item.consumoGas)} m³` : '—'}
                          </td>
                          <td className="p-3.5 text-right text-slate-400">
                            {item.tarifaGasTorre ? `R$ ${item.tarifaGasTorre.toFixed(2)}` : '—'}
                          </td>
                          <td className="p-3.5 text-right text-amber-400 font-semibold">
                            {item.valorGasHydrojexe !== undefined ? formatarMoedaBRL(item.valorGasHydrojexe) : '—'}
                          </td>
                          <td className="p-3.5 text-right text-slate-300">
                            {item.valorGasSergio !== undefined ? formatarMoedaBRL(item.valorGasSergio) : '—'}
                          </td>
                          <td className="p-3.5 text-center">
                            {isGasZerado ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-amber-500/15 text-amber-300 border border-amber-400/30" title="Folha do Sérgio veio sem valor de gás. Foi aplicada a tarifa calculada pela Hydrojexe.">
                                <HelpCircle className="w-3 h-3" />
                                Sérgio Zerado
                              </span>
                            ) : item.statusGas === 'VERDADEIRO' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                OK
                              </span>
                            ) : item.statusGas === 'FALSO' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <XCircle className="w-3 h-3" />
                                Divergente
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Total */}
                      {modoVis === 'CONSOLIDADO' && (
                        <td className="p-3.5 text-right font-bold text-slate-100">
                          {formatarMoedaBRL(item.valorTotalHydrojexe ?? item.valorHydrojexe)}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Rodapé da Tabela */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-400 font-sans flex flex-col sm:flex-row justify-between items-center gap-2">
           <span>Total: {dadosFiltrados.length} aptos | Aprovados: {contagens.aprovados} | Divergências: {contagens.divergencias} | Gás Zerado: {contagens.gasZerado}</span>
           <span>Página {paginaAtual} de {totalPaginas}</span>
        </div>
      </GlassCard>
    </div>
  );
}
