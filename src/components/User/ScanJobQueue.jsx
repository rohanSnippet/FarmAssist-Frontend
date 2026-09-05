import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  PENDING:    { label: 'Queued',     icon: <Loader2 className="w-4 h-4 animate-spin text-info" />,       colorClass: 'text-info', bgClass: 'bg-info/10 border-info/30' },
  PROCESSING: { label: 'Scanning…',  icon: <Loader2 className="w-4 h-4 animate-spin text-primary" />,    colorClass: 'text-primary', bgClass: 'bg-primary/10 border-primary/30'  },
  COMPLETED:  { label: 'Complete',   icon: <CheckCircle className="w-4 h-4 text-success" />, colorClass: 'text-success', bgClass: 'bg-success/10 border-success/30'  },
  FAILED:     { label: 'Failed',     icon: <AlertCircle className="w-4 h-4 text-error" />,   colorClass: 'text-error', bgClass: 'bg-error/10 border-error/30' },
};

const CONDITION_EMOJI = {
  healthy:  '✅',
  pest:     '🐛',
  disease:  '🍂',
  mix_both: '⚠️',
  unknown:  '❓',
};

function JobCard({ job, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.FAILED;
  const r = job.result;

  return (
    <div className={`p-4 mb-3 rounded-2xl border transition-all ${cfg.bgClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="shrink-0 mt-0.5">
            {cfg.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-base-content truncate">
                {r ? `${CONDITION_EMOJI[r.condition_type] ?? '❓'} ${r.primary_diagnosis}` : (job.crop_hint || 'Crop Scan')}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${cfg.colorClass} bg-base-100/50`}>
                {cfg.label}
              </span>
            </div>
            <div className="text-xs text-base-content/60 mt-1 truncate">
              {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {r && ` · ${r.crop} · ${Math.round((r.confidence ?? 0) * 100)}% conf`}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {job.status === 'COMPLETED' && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="btn btn-xs btn-ghost text-base-content/70"
            >
              {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
          )}
          <button 
            onClick={() => onRemove(job.id)}
            className="btn btn-xs btn-ghost text-error"
          >
            <X size={16}/>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && r && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-base-content/10">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  ['Crop',       r.crop],
                  ['Condition',  r.condition_type?.replace('_', ' ')],
                  ['Confidence', `${Math.round((r.confidence ?? 0) * 100)}%`],
                  ['Source',     r.source?.replace(/_/g, ' ')],
                ].map(([label, val]) => (
                  <div key={label} className="bg-base-100/50 p-2 rounded-lg">
                    <div className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider">{label}</div>
                    <div className="text-xs font-semibold text-base-content capitalize">{val ?? '—'}</div>
                  </div>
                ))}
              </div>

              {r.advisory && (
                <div className="bg-success/10 border border-success/20 p-3 rounded-xl">
                  <div className="text-[10px] text-success font-black uppercase tracking-wider mb-2">
                    💊 Advisory
                  </div>
                  <div className="text-xs text-base-content/80 whitespace-pre-wrap leading-relaxed">
                    {r.advisory}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {job.status === 'FAILED' && job.error_message && (
        <div className="mt-3 text-xs text-error bg-error/10 p-2 rounded-lg border border-error/20">
          {job.error_message}
        </div>
      )}
    </div>
  );
}

export default function ScanJobQueue({ jobs, onRemove, pendingCount }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[9999] flex flex-col items-end pointer-events-none">
      
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] bg-base-100/95 backdrop-blur-xl border border-base-content/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col pointer-events-auto"
          >
            <div className="p-5 border-b border-base-content/10 flex items-center justify-between bg-base-200/30">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2">
                  <span className="text-xl">🔬</span> Scan Queue
                </h3>
                <p className="text-xs text-base-content/60 font-medium mt-1">
                  {pendingCount > 0 ? (
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      {pendingCount} scan(s) in progress…
                    </span>
                  ) : (
                    'All scans complete'
                  )}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="btn btn-circle btn-sm btn-ghost bg-base-200">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              {jobs.length === 0 ? (
                <div className="py-10 text-center text-base-content/50">
                  <p className="text-sm font-medium">No scans yet.</p>
                  <p className="text-xs mt-1">Upload a crop image to get started.</p>
                </div>
              ) : (
                jobs.map(job => (
                  <JobCard key={job.id} job={job} onRemove={onRemove} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="pointer-events-auto relative btn btn-circle w-14 h-14 bg-base-100 border border-base-content/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform"
      >
        <span className="text-2xl">🔬</span>
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center bg-primary text-primary-content text-xs font-black rounded-full border-2 border-base-100 shadow-md">
            {pendingCount}
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40 animate-ping"></span>
          </span>
        )}
      </button>

    </div>
  );
}
