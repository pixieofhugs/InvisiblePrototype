// Queue page — Subrogation Opportunity Scout
const { useState, useEffect, useRef } = React;

// ── Error Claim Card ─────────────────────────────────────────────────────────
function ErrorClaimCard({ claim }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0',
      background: '#FFFCFC', border: '1px solid #FCA5A5',
      borderRadius: '8px', minHeight: '76px', overflow: 'hidden',
    }}>
      {/* Error icon column */}
      <div style={{ width: '80px', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: '#FEE2E2', border: '2px solid #FCA5A5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '18px', color: '#EF4444' }}>!</span>
          </div>
          <span style={{ fontSize: '10px', fontWeight: '600', color: '#B91C1C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ERROR
          </span>
        </div>
      </div>
      <div style={{ width: '1px', background: '#FEE2E2', alignSelf: 'stretch' }} />
      {/* Identity */}
      <div style={{ width: '210px', flexShrink: 0, padding: '14px 16px' }}>
        <div style={{ fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", color: '#374151', fontWeight: '500' }}>
          {claim.id}
        </div>
        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {claim.lob}
        </div>
        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>{claim.fnolRelative}</div>
      </div>
      <div style={{ width: '1px', background: '#FEE2E2', alignSelf: 'stretch' }} />
      {/* Error message */}
      <div style={{ flex: 1, padding: '14px 16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#B91C1C', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Analysis failed — {claim.errorType === 'parse_failure' ? 'document parse error' : 'model error'}
        </div>
        <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.45' }}>
          {claim.errorMessage}
        </div>
      </div>
      <div style={{ width: '1px', background: '#FEE2E2', alignSelf: 'stretch' }} />
      {/* Actions */}
      <div style={{ width: '130px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center', alignItems: 'center', padding: '14px 12px' }}>
        <button style={{
          fontSize: '12px', color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5',
          borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', width: '100%',
        }}>Resubmit</button>
        <button style={{
          fontSize: '12px', color: '#6B7280', background: '#F9FAFB', border: '1px solid #E5E7EB',
          borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', width: '100%',
        }}>Manual review</button>
      </div>
    </div>
  );
}

// ── Claim Card Row ────────────────────────────────────────────────────────────
function ClaimCard({ claim, onOpen, isNew }) {
  const [highlight, setHighlight] = useState(isNew);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setHighlight(false), 2400);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  if (claim.status === 'error') return <ErrorClaimCard claim={claim} />;

  const confirmed = claim.status === 'confirmed';
  const rejected  = claim.status === 'rejected';
  const deferred  = claim.status === 'deferred';
  const gathered  = claim.status === 'gather';
  const terminal  = confirmed || rejected;            // strike-through only when closed
  const actioned  = terminal || deferred || gathered; // mute + badge for any decision

  return (
    <div
      onClick={() => onOpen(claim.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0',
        background: highlight ? '#FFFBEB' : hovered ? '#F9FAFB' : actioned ? '#FAFAFA' : '#fff',
        border: `1px solid ${highlight ? '#FCD34D' : hovered ? '#D1D5DB' : '#E5E7EB'}`,
        borderRadius: '8px',
        opacity: actioned ? 0.72 : 1,
        transition: 'background 0.12s, border-color 0.12s',
        minHeight: '76px', overflow: 'hidden',
        cursor: 'pointer',
      }}>

      {/* Confidence column — 80px */}
      <div style={{ width: '80px', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px 8px' }}>
        <ConfidenceCircle confidence={claim.confidence} tier={claim.tier} />
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: '#F3F4F6', alignSelf: 'stretch' }} />

      {/* Identity — 210px */}
      <div style={{ width: '210px', flexShrink: 0, padding: '14px 16px' }}>
        <div style={{
          fontSize: '13px', fontFamily: "'JetBrains Mono', monospace",
          color: actioned ? '#9CA3AF' : '#1F2937', fontWeight: '500',
          textDecoration: terminal ? 'line-through' : 'none',
        }}>
          {claim.id}
        </div>
        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {claim.lob}
        </div>
        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>
          {claim.fnolRelative}
        </div>
        {actioned && (
          <div style={{ fontSize: '10px', fontWeight: '600', color: confirmed ? '#047857' : rejected ? '#B91C1C' : '#6B7280', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {confirmed ? '✓ Confirmed' : rejected ? '✗ Rejected' : deferred ? '→ Deferred' : '↗ Info requested'}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: '#F3F4F6', alignSelf: 'stretch' }} />

      {/* Recovery — 150px */}
      <div style={{ width: '150px', flexShrink: 0, padding: '14px 16px', textAlign: 'right' }}>
        <div style={{ fontSize: '22px', fontWeight: '700', color: actioned ? '#9CA3AF' : '#1F2937', lineHeight: 1 }}>
          ${claim.recovery.toLocaleString()}
        </div>
        <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Est. recovery
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: '#F3F4F6', alignSelf: 'stretch' }} />

      {/* SOL — 160px */}
      <div style={{ width: '160px', flexShrink: 0, padding: '14px 16px' }}>
        <SOLCountdown solDate={claim.solDate} solDays={claim.solDays} solUrgent={claim.solUrgent} />
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: '#F3F4F6', alignSelf: 'stretch' }} />

      {/* Thesis — flex */}
      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
        <div style={{
          fontSize: '14px', color: actioned ? '#9CA3AF' : '#374151',
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          lineHeight: '1.45',
        }}>
          {claim.thesis}
        </div>
        <div style={{ marginTop: '6px' }}>
          <ActionPill action={claim.action} small />
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: '#F3F4F6', alignSelf: 'stretch' }} />

      {/* Chevron — 56px */}
      <div style={{ width: '56px', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '14px 8px' }}>
        <span style={{ fontSize: '16px', color: actioned ? '#D1D5DB' : '#9CA3AF' }}>›</span>
      </div>
    </div>
  );
}

// ── Drop-a-Claim Modal ────────────────────────────────────────────────────────
function DropClaimModal({ onClose, onAdd }) {
  const [selected, setSelected] = useState('straightforward');
  const [status, setStatus] = useState('idle'); // idle | running | done

  const options = [
    { id: 'straightforward', label: 'Straightforward', desc: 'Personal auto rear-end collision with a named third party and citations on record.' },
    { id: 'ambiguous',       label: 'Ambiguous',       desc: 'General liability slip-and-fall with unclear contractor identification.' },
    { id: 'failure',         label: 'Failure mode',    desc: 'Single-vehicle DUI with attorney-raised manufacturer defect angle. Model will not overcommit.' },
  ];

  const handleRun = async () => {
    setStatus('running');
    const started = Date.now();
    let claim;
    try {
      // Backend runs a live Claude call (or simulated fallback) and reshapes the result.
      const res = await window.API.analyze(selected);
      claim = res.claim;
    } catch (err) {
      // Backend unreachable — fall back to the local template so the demo still works.
      console.error('analyze failed; using local template', err);
      claim = { ...window.NEW_CLAIM_TEMPLATES[selected] };
    }
    // Floor the spinner so an instant mock doesn't flash.
    const wait = Math.max(0, 500 - (Date.now() - started));
    setTimeout(() => {
      onAdd(claim);  // new-claim glow is driven by QueuePage's newIds set, keyed on claim.id
      setStatus('done');
      setTimeout(onClose, 600);
    }, wait);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={e => { if (e.target === e.currentTarget && status === 'idle') onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: '10px', width: '500px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.16)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ fontSize: '17px', fontWeight: '600', color: '#111827' }}>
            Run a new claim through the scout
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
            Runs the scout on a sample claim — live Claude call when a key is set,
            otherwise simulated. Takes a few seconds.
          </div>
        </div>

        {/* Options */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map(opt => (
            <label key={opt.id} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              padding: '12px 14px', borderRadius: '7px', cursor: 'pointer',
              border: `1.5px solid ${selected === opt.id ? '#6B7280' : '#E5E7EB'}`,
              background: selected === opt.id ? '#F9FAFB' : '#fff',
              transition: 'border-color 0.1s, background 0.1s',
            }}>
              <input
                type="radio" name="claimType" value={opt.id}
                checked={selected === opt.id}
                onChange={() => setSelected(opt.id)}
                style={{ marginTop: '2px', accentColor: '#374151' }}
                disabled={status !== 'idle'}
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>{opt.label}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', lineHeight: '1.45' }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #F3F4F6',
          display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center',
        }}>
          {status === 'running' && (
            <span style={{ fontSize: '13px', color: '#6B7280', marginRight: 'auto' }}>
              Analyzing claim{['', '.', '..', '...'][Math.floor(Date.now() / 600) % 4] || '...'}
            </span>
          )}
          {status === 'idle' && (
            <button onClick={onClose} style={{
              padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: '6px',
              background: '#fff', color: '#374151', fontSize: '13px', cursor: 'pointer',
            }}>
              Cancel
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={status !== 'idle'}
            style={{
              padding: '8px 20px', border: 'none', borderRadius: '6px',
              background: status === 'idle' ? '#1F2937' : '#9CA3AF',
              color: '#fff', fontSize: '13px', fontWeight: '500',
              cursor: status === 'idle' ? 'pointer' : 'not-allowed',
            }}
          >
            {status === 'idle' ? 'Run analysis' : status === 'running' ? 'Running…' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Queue Page ────────────────────────────────────────────────────────────────
function QueuePage({ claims, onOpenClaim, onAddClaim, onReset }) {
  const [showModal, setShowModal] = useState(false);
  const [newIds, setNewIds] = useState(new Set());
  const [filterTier, setFilterTier] = useState([]);
  const [filterAction, setFilterAction] = useState([]);
  const [sortBy, setSortBy] = useState('sol');

  const pending   = claims.filter(c => c.status === 'pending');
  const highConf  = pending.filter(c => c.tier === 'HIGH').length;
  const solUrgent = pending.filter(c => c.solUrgent).length;

  const handleAdd = (claim) => {
    setNewIds(prev => new Set([...prev, claim.id]));
    onAddClaim(claim);
    setTimeout(() => setNewIds(prev => { const s = new Set(prev); s.delete(claim.id); return s; }), 3000);
  };

  // Filter + sort
  let displayed = [...claims];
  if (filterTier.length)   displayed = displayed.filter(c => filterTier.includes(c.tier));
  if (filterAction.length) displayed = displayed.filter(c => filterAction.includes(c.action));
  if (sortBy === 'sol')         displayed.sort((a, b) => a.solDays - b.solDays);
  else if (sortBy === 'conf')   displayed.sort((a, b) => b.confidence - a.confidence);
  else if (sortBy === 'recovery') displayed.sort((a, b) => b.recovery - a.recovery);

  const tiers   = ['HIGH', 'MEDIUM', 'LOW'];
  const actions = ['ROUTE_TO_DEMAND', 'GATHER_MORE_INFO', 'REJECT', 'DEFER'];

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#FAFAF9' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 40px' }}>

        {/* Metric tiles */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <MetricTile value={claims.length} label="Flagged in queue" />
          <MetricTile value={highConf} label="HIGH confidence" accent="#047857" />
          <MetricTile value={solUrgent} label="SOL within 30 days" accent="#B91C1C" />
        </div>

        {/* Filter + action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          {/* Tier filter */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '2px' }}>Confidence</span>
            {tiers.map(t => (
              <button key={t} onClick={() => setFilterTier(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} style={{
                padding: '4px 9px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                border: `1px solid ${filterTier.includes(t) ? window.TIER_CONFIG[t].dark : '#E5E7EB'}`,
                background: filterTier.includes(t) ? window.TIER_CONFIG[t].bg : '#fff',
                color: filterTier.includes(t) ? window.TIER_CONFIG[t].dark : '#6B7280',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: '#E5E7EB' }} />

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sort</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              fontSize: '12px', color: '#374151', border: '1px solid #E5E7EB',
              borderRadius: '4px', padding: '4px 8px', background: '#fff', cursor: 'pointer',
            }}>
              <option value="sol">SOL urgency</option>
              <option value="conf">Confidence (high→low)</option>
              <option value="recovery">Recovery amount</option>
            </select>
          </div>

          <div style={{ flex: 1 }} />

          {/* Reset demo */}
          {onReset && (
            <button onClick={() => {
              if (window.confirm('Reset the demo to its seeded state? This clears dropped claims and reviewer actions.')) onReset();
            }} style={{
              padding: '7px 12px', background: '#fff', color: '#6B7280',
              border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
            }}>
              Reset demo
            </button>
          )}

          {/* Drop claim button */}
          <button onClick={() => setShowModal(true)} style={{
            padding: '8px 16px', background: '#1F2937', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Drop a new claim
          </button>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'flex', padding: '6px 0 6px',
          fontSize: '10px', fontWeight: '600', color: '#9CA3AF',
          textTransform: 'uppercase', letterSpacing: '0.07em',
          borderBottom: '1px solid #E5E7EB', marginBottom: '8px',
        }}>
          <div style={{ width: '80px', flexShrink: 0, textAlign: 'center' }}>Conf.</div>
          <div style={{ width: '210px', flexShrink: 0, paddingLeft: '16px' }}>Claim / LOB</div>
          <div style={{ width: '150px', flexShrink: 0, textAlign: 'right', paddingRight: '16px' }}>Recovery</div>
          <div style={{ width: '160px', flexShrink: 0, paddingLeft: '16px' }}>SOL</div>
          <div style={{ flex: 1, paddingLeft: '16px' }}>Thesis / Action</div>
          <div style={{ width: '56px', flexShrink: 0 }}></div>
        </div>

        {/* Claim cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {displayed.map(claim => (
            <ClaimCard key={claim.id} claim={claim} onOpen={onOpenClaim} isNew={newIds.has(claim.id)} />
          ))}
        </div>

        {displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: '14px' }}>
            No claims match the current filters.
          </div>
        )}
      </div>

      {showModal && <DropClaimModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}

Object.assign(window, { QueuePage });
