// Shared UI components — Subrogation Opportunity Scout
// Exports to window: TopBar, MetricTile, ConfidenceCircle, ConfidenceChip, ActionPill, SOLCountdown

const { useState } = React;

// ── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ page, goQueue, goAudit, goErrors }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: '56px', background: '#fff',
      borderBottom: '1px solid #E5E7EB', flexShrink: 0, gap: '16px',
    }}>
      {/* Product + Carrier */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
        <span style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', letterSpacing: '-0.01em' }}>
          Subrogation Opportunity Scout
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151', letterSpacing: '0.02em' }}>
            PURSUANT INDEMNITY MUTUAL
          </span>
          <span style={{ fontSize: '10px', color: '#9CA3AF', fontStyle: 'italic' }}>
            Reliable, where applicable.
          </span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {[
          { label: 'Queue', key: 'queue', onClick: goQueue },
          { label: 'Audit Log', key: 'audit', onClick: goAudit },
          { label: 'Error States', key: 'errors', onClick: goErrors },
        ].map(({ label, key, onClick }) => (
          <button key={key} onClick={onClick} style={{
            padding: '5px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer',
            fontSize: '13px', fontWeight: page === key ? '600' : '400',
            background: page === key ? '#F3F4F6' : 'transparent',
            color: page === key ? '#111827' : '#6B7280',
          }}>{label}</button>
        ))}
      </div>

      {/* Reviewer + Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '12px', color: '#6B7280', fontFamily: "'JetBrains Mono', monospace" }}>{today}</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          background: '#F9FAFB', border: '1px solid #E5E7EB',
          borderRadius: '6px', padding: '4px 10px',
        }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: '600', color: '#374151',
          }}>MS</div>
          <span style={{ fontSize: '12px', color: '#374151' }}>Molly Shove</span>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Subro Reviewer</span>
        </div>
      </div>
    </div>
  );
}

// ── Metric Tile ──────────────────────────────────────────────────────────────
function MetricTile({ value, label, accent }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px',
      padding: '16px 20px', minWidth: '180px',
    }}>
      <div style={{ fontSize: '28px', fontWeight: '700', color: accent || '#1F2937', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  );
}

// ── Confidence Circle (queue card, small) ────────────────────────────────────
function ConfidenceCircle({ confidence, tier }) {
  const cfg = window.TIER_CONFIG[tier];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
          {confidence.toFixed(2)}
        </span>
      </div>
      <span style={{ fontSize: '10px', fontWeight: '600', color: cfg.dark, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {tier}
      </span>
    </div>
  );
}

// ── Confidence Chip (detail pane, large pill) ────────────────────────────────
function ConfidenceChip({ confidence, tier }) {
  const cfg = window.TIER_CONFIG[tier];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '10px',
      background: cfg.bg, border: `1px solid ${cfg.color}40`,
      borderRadius: '8px', padding: '10px 16px',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
          {confidence.toFixed(2)}
        </span>
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: cfg.dark, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {tier} CONFIDENCE
        </div>
        <div style={{ fontSize: '11px', color: cfg.dark + 'cc' }}>AI assessment</div>
      </div>
    </div>
  );
}

// ── Action Pill Badge ────────────────────────────────────────────────────────
function ActionPill({ action, small }) {
  const cfg = window.ACTION_CONFIG[action];
  if (!cfg) return null;
  return (
    <span style={{
      display: 'inline-block',
      fontSize: small ? '10px' : '11px',
      fontWeight: '600',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '4px',
      padding: small ? '2px 6px' : '3px 8px',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ── SOL Countdown ────────────────────────────────────────────────────────────
function SOLCountdown({ solDate, solDays, solUrgent, inline }) {
  if (inline) {
    return solUrgent ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '12px', color: '#B91C1C' }}>⏱</span>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#B91C1C' }}>
          EXPIRES IN {solDays} DAYS
        </span>
      </span>
    ) : (
      <span style={{ fontSize: '13px', color: '#6B7280' }}>
        expires in {solDays} days
      </span>
    );
  }

  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: "'JetBrains Mono', monospace" }}>
        SOL: {solDate}
      </div>
      <SOLCountdown solDate={solDate} solDays={solDays} solUrgent={solUrgent} inline={true} />
    </div>
  );
}

// ── Evidence Badge (numbered circle) ─────────────────────────────────────────
function EvBadge({ id, isContra }) {
  const NUMBERS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
      fontSize: '11px', fontWeight: '700',
      background: isContra ? '#FED7AA' : '#FEF3C7',
      color: isContra ? '#92400E' : '#92400E',
      marginRight: '5px', verticalAlign: 'middle',
      border: isContra ? '1px solid #FCA57A' : '1px solid #FCD34D',
    }}>
      {isContra ? '⚠' : (NUMBERS[Number(id) - 1] || id)}
    </span>
  );
}

Object.assign(window, { TopBar, MetricTile, ConfidenceCircle, ConfidenceChip, ActionPill, SOLCountdown, EvBadge });
