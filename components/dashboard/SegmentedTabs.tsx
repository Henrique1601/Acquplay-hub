// components/dashboard/SegmentedTabs.tsx
import React, { useRef } from 'react';
import { UploadCloud, Scale, Flame, AlertTriangle } from 'lucide-react';

export type TabId = 'upload' | 'conciliacao' | 'gas' | 'auditoria';

interface SegmentedTabsProps {
  tabAtiva: TabId;
  onSelecionarTab: (tab: TabId) => void;
  contagemConciliacao: number;
  contagemAuditoria: number;
}

export function SegmentedTabs({
  tabAtiva,
  onSelecionarTab,
  contagemConciliacao,
  contagemAuditoria
}: SegmentedTabsProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'upload', label: 'Upload & Leituras', icon: UploadCloud },
    { id: 'conciliacao', label: 'Conciliação Sabesp', icon: Scale, badge: contagemConciliacao },
    { id: 'gas', label: 'Tarifa Gás Comgás (16 Medidores)', icon: Flame },
    { id: 'auditoria', label: 'Auditoria Cruzada (3:1)', icon: AlertTriangle, badge: contagemAuditoria }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let proximoIndex = index;
    if (e.key === 'ArrowRight') {
      proximoIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      proximoIndex = (index - 1 + tabs.length) % tabs.length;
    } else {
      return;
    }

    e.preventDefault();
    const proximaTab = tabs[proximoIndex];
    onSelecionarTab(proximaTab.id);
    tabsRef.current[proximoIndex]?.focus();
  };

  return (
    <div className="w-full mb-6">
      <div 
        role="tablist" 
        aria-label="Módulos Operacionais do AcquaPlay"
        className="flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md overflow-x-auto gap-1"
      >
        {tabs.map((t, idx) => {
          const isAtivo = tabAtiva === t.id;
          const Icon = t.icon;

          return (
            <button
              key={t.id}
              ref={(el) => { tabsRef.current[idx] = el; }}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={isAtivo}
              aria-controls={`panel-${t.id}`}
              tabIndex={isAtivo ? 0 : -1}
              onClick={() => onSelecionarTab(t.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`apple-press flex-1 min-w-fit px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer ${
                isAtivo
                  ? 'bg-slate-800 text-white font-semibold shadow-xs border border-white/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isAtivo ? 'text-sky-400' : 'text-slate-500'}`} />
              <span className="whitespace-nowrap">{t.label}</span>
              {t.badge !== undefined && (
                <span 
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isAtivo 
                      ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
