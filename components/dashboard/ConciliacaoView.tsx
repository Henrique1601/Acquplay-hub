// components/dashboard/ConciliacaoView.tsx
import React, { useState, useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Search, CheckCircle2, XCircle, Download } from 'lucide-react';
import { ItemConciliacao, formatarMoedaBRL, formatarM3 } from '@/lib/acquaPlayEngine';

interface ConciliacaoViewProps {
  dados: ItemConciliacao[];
  onExportarExcel: () => void;
}

export function ConciliacaoView({ dados, onExportarExcel }: ConciliacaoViewProps) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'VERDADEIRO' | 'FALSO'>('TODOS');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 50;

  const divergenciasCount = useMemo(() => {
    return dados.filter(d => d.status === 'FALSO').length;
  }, [dados]);

  const aprovadosCount = dados.length - divergenciasCount;

  const dadosFiltrados = useMemo(() => {
    return dados.filter(item => {
      const matchStatus = filtroStatus === 'TODOS' || item.status === filtroStatus;
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
            placeholder="Buscar por torre ou apartamento (ex: Torre A, 0031)..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800/80">
            <button
              type="button"
              onClick={() => { setFiltroStatus('TODOS'); setPaginaAtual(1); }}
              className={`apple-press px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                filtroStatus === 'TODOS'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({dados.length})
            </button>

            <button
              type="button"
              onClick={() => { setFiltroStatus('VERDADEIRO'); setPaginaAtual(1); }}
              className={`apple-press px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                filtroStatus === 'VERDADEIRO'
                  ? 'bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800/60 shadow-xs'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aprovados ({aprovadosCount})</span>
            </button>

            <button
              type="button"
              onClick={() => { setFiltroStatus('FALSO'); setPaginaAtual(1); }}
              className={`apple-press px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                filtroStatus === 'FALSO'
                  ? 'bg-rose-950 text-rose-300 font-semibold border border-rose-800/60 shadow-xs'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Divergências ({divergenciasCount})</span>
            </button>
          </div>

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
                <th scope="col" className="p-3.5 text-right">Diferença (R$)</th>
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

                  return (
                    <tr 
                      key={`${item.unidade}-${idx}`}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isDivergente ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="p-3.5 font-sans font-medium text-slate-200">
                        {item.unidade}
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
                        {item.diferenca === 0 
                          ? '—' 
                          : `${item.diferenca > 0 ? '+' : ''}${formatarMoedaBRL(item.diferenca)}`
                        }
                      </td>
                      <td className="p-3.5 text-center">
                        {isDivergente ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> FALSO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> VERDADEIRO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela & Paginação */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400 font-sans">
          <div>
            Mostrando {dadosFiltrados.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1}–
            {Math.min(paginaAtual * ITENS_POR_PAGINA, dadosFiltrados.length)} de {dadosFiltrados.length} unidades 
            <span className="text-slate-500 ml-2">• Tolerância contábil: ± R$ 0,02</span>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual(prev => Math.max(1, prev - 1))}
                className="apple-press px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition"
              >
                Anterior
              </button>

              <span className="font-mono text-slate-300">
                {paginaAtual} / {totalPaginas}
              </span>

              <button
                type="button"
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPaginaAtual(prev => Math.min(totalPaginas, prev + 1))}
                className="apple-press px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
