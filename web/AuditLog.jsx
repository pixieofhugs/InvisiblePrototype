// Audit Log page — Subrogation Opportunity Scout
const { useState } = React;

function AuditLogPage({ log }) {
  const [claimFilter, setClaimFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState([]);

  const EVENT_TYPES = ['claim_received', 'model_run', 'reviewer_action'];
  const TYPE_LABELS  = { claim_received: 'Claim received', model_run: 'Model run', reviewer_action: 'Reviewer action' };
  const TYPE_STYLES  = {
    claim_received:  { bg: '#F3F4F6', color: '#4B5563' },
    model_run:       { bg: '#EFF6FF', color: '#1D4ED8' },
    reviewer_action: { bg: '#F0FDF4', color: '#047857' },
  };

  const filtered = log.filter(row => {
    if (claimFilter && !row.claimId.toLowerCase().includes(claimFilter.toLowerCase())) return false;
    if (typeFilter.length && !typeFilter.includes(row.type)) return false;
    return true;
  });

  const handleExport = (fmt) => {
    if (fmt === 'json') {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'audit-log.json'; a.click();
    } else {
      const header = 'Timestamp,Claim ID,Event Type,Model Version,Reviewer,Action/Decision,Confidence,Notes';
      const rows = filtered.map(r =>
        [r.ts, r.claimId, r.type, r.modelVersion, r.reviewer, `"${r.action}"`, r.confidence ?? '', `"${r.notes}"`].join(',')
      );
      const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'audit-log.csv'; a.click();
    }
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#FAFAF9' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 28px 48px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', flex: 1 }}>Audit Log</h1>
          <button onClick={() => handleExport('json')} style={{
            padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: '5px',
            background: '#fff', fontSize: '12px', color: '#374151', cursor: 'pointer', fontWeight: '500',
          }}>Export JSON</button>
          <button onClick={() => handleExport('csv')} style={{
            padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: '5px',
            background: '#fff', fontSize: '12px', color: '#374151', cursor: 'pointer', fontWeight: '500',
          }}>Export CSV</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Filter by claim ID..."
            value={claimFilter}
            onChange={e => setClaimFilter(e.target.value)}
            style={{
              padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: '5px',
              fontSize: '13px', color: '#374151', width: '240px', background: '#fff',
            }}
          />
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>
              Event type
            </span>
            {EVENT_TYPES.map(t => {
              const active = typeFilter.includes(t);
              const s = TYPE_STYLES[t];
              return (
                <button key={t} onClick={() => setTypeFilter(prev => active ? prev.filter(x => x !== t) : [...prev, t])} style={{
                  padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                  cursor: 'pointer', border: `1px solid ${active ? s.color + '60' : '#E5E7EB'}`,
                  background: active ? s.bg : '#fff', color: active ? s.color : '#6B7280',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {TYPE_LABELS[t]}
                </button>
              );
            })}
            {(claimFilter || typeFilter.length > 0) && (
              <button onClick={() => { setClaimFilter(''); setTypeFilter([]); }} style={{
                padding: '4px 10px', borderRadius: '4px', fontSize: '11px',
                cursor: 'pointer', border: '1px solid #E5E7EB', background: '#fff', color: '#9CA3AF',
              }}>Clear</button>
            )}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9CA3AF' }}>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Table */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {[
                  { label: 'Timestamp (UTC)',  w: '195px' },
                  { label: 'Claim ID',         w: '165px' },
                  { label: 'Event',            w: '150px' },
                  { label: 'Model version',    w: '130px' },
                  { label: 'Reviewer',         w: '140px' },
                  { label: 'Action / Decision',w: 'auto'  },
                  { label: 'Confidence',       w: '100px' },
                  { label: 'Notes',            w: '200px' },
                ].map(({ label, w }) => (
                  <th key={label} style={{
                    padding: '9px 14px', textAlign: 'left',
                    fontSize: '10px', fontWeight: '700', color: '#9CA3AF',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    width: w, whiteSpace: 'nowrap',
                  }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const s = TYPE_STYLES[row.type] || TYPE_STYLES.claim_received;
                return (
                  <tr key={i} style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none',
                    background: i % 2 === 0 ? '#fff' : '#FAFAFA',
                  }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#374151' }}>
                        {row.ts}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#374151' }}>
                        {row.claimId}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
                        letterSpacing: '0.05em', padding: '2px 8px', borderRadius: '4px',
                        background: s.bg, color: s.color,
                      }}>
                        {TYPE_LABELS[row.type]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {row.modelVersion && (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#9CA3AF' }}>
                          {row.modelVersion}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: '#374151' }}>
                      {row.reviewer || <span style={{ color: '#D1D5DB' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: '#1F2937', maxWidth: '240px' }}>
                      {row.action}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {row.confidence != null ? (
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>
                          {row.confidence.toFixed(2)}
                        </span>
                      ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#6B7280', maxWidth: '200px' }}>
                      {row.notes ? (
                        <span style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {row.notes}
                        </span>
                      ) : <span style={{ color: '#D1D5DB' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                    No entries match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AuditLogPage });
