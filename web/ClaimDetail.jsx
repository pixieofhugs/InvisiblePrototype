// Claim Detail — three-pane layout
// Left: source documents with highlighted quotes
// Middle: AI assessment
// Right: reviewer actions + audit trail

const { useState, useEffect, useRef } = React;

// ── Document Pane (left, 40%) ─────────────────────────────────────────────────
function DocumentPane({ claim, activeDoc, setActiveDoc, activeEvId, setActiveEvId }) {
  const docKeys = Object.keys(claim.docs);
  const doc = claim.docs[activeDoc] || claim.docs[docKeys[0]];
  const scrollRef = useRef(null);
  const evRefs = useRef({});
  const [showAll, setShowAll] = useState(false);

  // Scroll to active evidence
  useEffect(() => {
    if (activeEvId == null) return;
    const key = String(activeEvId);
    const el = evRefs.current[key];
    const container = scrollRef.current;
    if (el && container) {
      const top = el.offsetTop - container.getBoundingClientRect().top - 80;
      container.scrollTop = Math.max(0, top);
    }
  }, [activeEvId, activeDoc]);

  // All evidence in current doc for "show all" toggle
  const allEvInDoc = [
    ...(claim.evidence || []).filter(e => e.docKey === activeDoc),
    ...(claim.contradicting || []).filter(e => e.docKey === activeDoc),
  ];

  const renderParts = (parts) => {
    return parts.map((part, i) => {
      if (part.t === 'text') {
        return (
          <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part.v}</span>
        );
      }
      if (part.t === 'ev') {
        const isActive = activeEvId === part.id;
        return (
          <span
            key={i}
            ref={el => { evRefs.current[String(part.id)] = el; }}
            style={{
              display: 'inline',
              background: isActive ? '#FDE68A' : '#FEF3C7',
              borderRadius: '2px',
              padding: '1px 0',
              boxShadow: isActive ? '0 0 0 2px #F59E0B' : 'none',
              cursor: 'pointer',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
            onClick={() => setActiveEvId(isActive ? null : part.id)}
            title="Click to highlight this evidence in the assessment"
          >
            <EvBadge id={part.id} isContra={false} />
            {part.v}
          </span>
        );
      }
      if (part.t === 'cv') {
        const isActive = activeEvId === part.id;
        return (
          <span
            key={i}
            ref={el => { evRefs.current[String(part.id)] = el; }}
            style={{
              display: 'inline',
              background: isActive ? '#FDBA74' : '#FED7AA',
              borderRadius: '2px',
              padding: '1px 0',
              boxShadow: isActive ? '0 0 0 2px #F97316' : 'none',
              cursor: 'pointer',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
            onClick={() => setActiveEvId(isActive ? null : part.id)}
            title="Contradicting evidence — click to highlight"
          >
            <EvBadge id={part.id} isContra={true} />
            {part.v}
          </span>
        );
      }
      return null;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #E5E7EB' }}>
      {/* Tab strip */}
      <div style={{
        display: 'flex', gap: '0', borderBottom: '1px solid #E5E7EB',
        background: '#F9FAFB', flexShrink: 0, overflowX: 'auto',
      }}>
        {docKeys.map(key => (
          <button key={key} onClick={() => { setActiveDoc(key); setActiveEvId(null); }} style={{
            padding: '10px 16px', border: 'none', borderBottom: activeDoc === key ? '2px solid #1F2937' : '2px solid transparent',
            background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            fontSize: '13px', fontWeight: activeDoc === key ? '600' : '400',
            color: activeDoc === key ? '#111827' : '#6B7280',
            marginBottom: '-1px',
          }}>{key}</button>
        ))}
      </div>

      {/* Document content */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '24px 24px 24px 28px' }}>
        <div style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '15px', lineHeight: '1.7', color: '#1F2937',
          maxWidth: '600px',
        }}>
          {doc && renderParts(doc.parts)}
        </div>

        {/* Show all evidence toggle */}
        {allEvInDoc.length > 0 && (
          <div style={{ marginTop: '32px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
            <button
              onClick={() => setShowAll(p => !p)}
              style={{
                fontSize: '12px', color: '#6B7280', background: 'none', border: 'none',
                cursor: 'pointer', padding: '0', textDecoration: 'underline',
              }}
            >
              {showAll ? 'Hide evidence list' : `Show all evidence in this document (${allEvInDoc.length})`}
            </button>
            {showAll && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {allEvInDoc.map((ev, i) => {
                  const isContra = !!ev.id && String(ev.id).startsWith('C');
                  return (
                    <div key={i} style={{
                      background: isContra ? '#FFF7ED' : '#FFFBEB',
                      border: `1px solid ${isContra ? '#FED7AA' : '#FEF3C7'}`,
                      borderRadius: '6px', padding: '10px 12px', fontSize: '13px',
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <EvBadge id={ev.id} isContra={isContra} />
                        <div>
                          <div style={{ fontStyle: 'italic', color: '#374151', lineHeight: '1.5' }}>"{ev.quote}"</div>
                          <div style={{ marginTop: '5px', color: '#6B7280', fontSize: '12px' }}>{ev.claim}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Assessment Pane (middle, 35%) ─────────────────────────────────────────────
function AssessmentPane({ claim, activeEvId, onEvidenceClick }) {
  const NUMS = ['①','②','③','④','⑤'];

  const EvidenceItem = ({ ev, isContra }) => {
    const isActive = activeEvId === ev.id;
    return (
      <div
        onClick={() => onEvidenceClick(ev.id, ev.docKey)}
        style={{
          padding: '10px 12px', borderRadius: '6px', cursor: 'pointer',
          background: isActive ? (isContra ? '#FFF0E5' : '#FFFDE8') : (isContra ? '#FFFAF5' : '#FFFEF5'),
          border: `1px solid ${isActive ? (isContra ? '#FCA57A' : '#FCD34D') : '#F3F4F6'}`,
          transition: 'background 0.15s, border-color 0.15s',
          display: 'flex', gap: '10px', alignItems: 'flex-start',
        }}
      >
        <EvBadge id={ev.id} isContra={isContra} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
            {ev.source}
          </div>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#374151', lineHeight: '1.5',
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          }}>
            "{ev.quote}"
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', lineHeight: '1.45' }}>
            {ev.claim}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', borderRight: '1px solid #E5E7EB' }}>
      <div style={{ padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Confidence chip */}
        <ConfidenceChip confidence={claim.confidence} tier={claim.tier} />

        {/* Thesis */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            AI Assessment
          </div>
          <p style={{ fontSize: '17px', color: '#111827', lineHeight: '1.55', margin: 0, fontWeight: '400' }}>
            {claim.thesis}
          </p>
        </div>

        {/* Third party */}
        <div style={{
          background: claim.thirdParty.identified ? '#F9FAFB' : '#FFFBEB',
          border: `1px solid ${claim.thirdParty.identified ? '#E5E7EB' : '#FCD34D'}`,
          borderRadius: '7px', padding: '12px 14px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
            Third Party
            {!claim.thirdParty.identified && (
              <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: '600', color: '#B45309', background: '#FEF3C7', padding: '1px 6px', borderRadius: '3px' }}>
                OPEN QUESTION
              </span>
            )}
          </div>
          {[
            { label: 'Name',    value: claim.thirdParty.name },
            { label: 'Type',    value: claim.thirdParty.type },
            { label: 'Insurer', value: claim.thirdParty.carrier },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF', width: '50px', flexShrink: 0 }}>{label}</span>
              <span style={{
                fontSize: '12px', color: claim.thirdParty.identified ? '#374151' : '#9CA3AF',
                fontStyle: claim.thirdParty.identified ? 'normal' : 'italic',
              }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Recovery + SOL */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '7px', padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Est. Recovery</div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>
              ${claim.recovery.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{claim.recoveryBasis}</div>
          </div>
          <div style={{ flex: 1, background: claim.solUrgent ? '#FEF2F2' : '#F9FAFB', border: `1px solid ${claim.solUrgent ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: '7px', padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Statute of Limitations</div>
            <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{claim.solState} · {claim.solDate}</div>
            <div style={{ marginTop: '3px' }}>
              <SOLCountdown solDate={claim.solDate} solDays={claim.solDays} solUrgent={claim.solUrgent} inline={true} />
            </div>
          </div>
        </div>

        {/* Supporting evidence */}
        {claim.evidence.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Supporting Evidence ({claim.evidence.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {claim.evidence.map(ev => <EvidenceItem key={ev.id} ev={ev} isContra={false} />)}
            </div>
          </div>
        )}

        {/* Contradicting evidence */}
        {claim.contradicting.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚠</span> Contradicting Evidence ({claim.contradicting.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {claim.contradicting.map(ev => <EvidenceItem key={ev.id} ev={ev} isContra={true} />)}
            </div>
          </div>
        )}

        {/* Reviewer warnings */}
        {claim.warnings.length > 0 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '7px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Reviewer Warnings
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {claim.warnings.map((w, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#78350F', lineHeight: '1.5' }}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Open questions */}
        {claim.openQuestions.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Open Questions
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {claim.openQuestions.map((q, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended action */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Recommended Action
          </div>
          <ActionPill action={claim.action} />
        </div>

      </div>
    </div>
  );
}

// ── Actions Pane (right, 25%) ─────────────────────────────────────────────────
function ActionsPane({ claim, onAction, actionTaken, onUndo }) {
  const REVIEWERS = [
    { name: 'Molly Shove',    role: 'Subro Reviewer',     initials: 'MS' },
    { name: 'James Okafor',   role: 'Subro Reviewer',     initials: 'JO' },
    { name: 'Dana Whitfield', role: 'Sr. Subro Reviewer', initials: 'DW' },
    { name: 'Tom Reyes',      role: 'Subro Reviewer',     initials: 'TR' },
    { name: 'Patricia Huang', role: 'Subro Manager',      initials: 'PH' },
  ];

  const [notes, setNotes] = useState('');
  const [reviewerIdx, setReviewerIdx] = useState(0);
  const reviewer = REVIEWERS[reviewerIdx];

  const handleAction = (decision) => {
    onAction(claim.id, notes, decision, reviewer.name);
  };

  const auditTypeLabel = { claim_received: 'Claim received', model_run: 'Model run', reviewer_action: 'Reviewer action' };
  const auditTypePill = (type) => {
    const styles = {
      claim_received: { bg: '#F3F4F6', color: '#6B7280' },
      model_run:      { bg: '#EFF6FF', color: '#1D4ED8' },
      reviewer_action:{ bg: '#EFF6FF', color: '#1D4ED8' },
    };
    const s = styles[type] || styles.claim_received;
    return (
      <span style={{
        fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em',
        padding: '1px 6px', borderRadius: '3px',
        background: s.bg, color: s.color,
      }}>
        {auditTypeLabel[type] || type}
      </span>
    );
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#FAFAF9' }}>
      <div style={{ padding: '20px 18px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Success banner */}
        {actionTaken && (
          <div style={{
            background: actionTaken === 'rejected' ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${actionTaken === 'rejected' ? '#FCA5A5' : '#86EFAC'}`,
            borderRadius: '7px', padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: actionTaken === 'rejected' ? '#B91C1C' : '#047857', marginBottom: '3px' }}>
                  {actionTaken === 'confirmed' ? '✓ Confirmed & routed for demand letter' :
                   actionTaken === 'rejected'  ? '✗ Rejected' :
                   actionTaken === 'deferred'  ? '→ Deferred for senior review' :
                   '↗ Gather more info requested'}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC · {reviewer.name}
                </div>
              </div>
              <button
                onClick={onUndo}
                style={{
                  fontSize: '11px', color: '#6B7280', background: '#fff',
                  border: '1px solid #D1D5DB', borderRadius: '4px',
                  padding: '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6B7280'; }}
              >
                Change decision
              </button>
            </div>
          </div>
        )}

        {/* Reviewer ID */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '7px', padding: '12px 14px' }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Reviewing as
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '600', color: '#374151',
            }}>
              {reviewer.initials}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1F2937' }}>{reviewer.name}</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{reviewer.role}</div>
            </div>
          </div>
          <select
            value={reviewerIdx}
            onChange={e => setReviewerIdx(Number(e.target.value))}
            disabled={!!actionTaken}
            style={{
              width: '100%', padding: '6px 10px',
              border: '1px solid #E5E7EB', borderRadius: '5px',
              fontSize: '12px', color: '#374151',
              background: actionTaken ? '#F9FAFB' : '#fff',
              cursor: actionTaken ? 'not-allowed' : 'pointer',
            }}
          >
            {REVIEWERS.map((r, i) => (
              <option key={i} value={i}>{r.name} — {r.role}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
            Notes (added to audit log)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={!!actionTaken}
            placeholder="Optional reviewer note..."
            style={{
              width: '100%', minHeight: '80px', padding: '10px 12px',
              border: '1px solid #E5E7EB', borderRadius: '6px',
              fontSize: '13px', color: '#374151', lineHeight: '1.5',
              resize: 'vertical', background: actionTaken ? '#F9FAFB' : '#fff',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { decision: 'confirmed', label: 'Confirm & Route to Demand Letter',
              style: { background: actionTaken ? '#D1FAE5' : '#047857', color: actionTaken ? '#047857' : '#fff', border: `1px solid ${actionTaken ? '#6EE7B7' : '#047857'}` } },
            { decision: 'gather',    label: 'Gather More Info',
              style: { background: '#fff', color: '#B45309', border: '1px solid #FCD34D' } },
            { decision: 'rejected',  label: 'Reject',
              style: { background: '#fff', color: '#B91C1C', border: '1px solid #FCA5A5' } },
            { decision: 'deferred',  label: 'Defer for Senior Review',
              style: { background: '#fff', color: '#6B7280', border: '1px solid #D1D5DB' } },
          ].map(({ decision, label, style }) => (
            <button
              key={decision}
              onClick={() => !actionTaken && handleAction(decision)}
              disabled={!!actionTaken}
              style={{
                ...style,
                width: '100%', padding: '10px 14px',
                borderRadius: '6px', fontSize: '13px', fontWeight: decision === 'confirmed' ? '600' : '500',
                cursor: actionTaken ? 'not-allowed' : 'pointer',
                opacity: actionTaken && actionTaken !== decision ? 0.45 : 1,
                transition: 'opacity 0.2s',
                textAlign: 'center',
              }}
            >{label}</button>
          ))}
        </div>

        {/* Audit trail for this claim */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
            Audit trail — {claim.id}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...claim.auditTrail].reverse().map((entry, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#374151' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#9CA3AF', flexShrink: 0 }}>
                    {entry.ts}
                  </span>
                  {auditTypePill(entry.type)}
                </div>
                <div style={{ marginTop: '2px', color: '#374151' }}>
                  {entry.type === 'model_run' && (
                    <span>{entry.detail} · <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>v:{entry.modelVersion}</span> · conf <strong>{entry.confidence?.toFixed(2)}</strong></span>
                  )}
                  {entry.type === 'reviewer_action' && (
                    <span>{entry.decision || entry.detail}{entry.notes ? ` · "${entry.notes}"` : ''}</span>
                  )}
                  {entry.type === 'claim_received' && (
                    <span>{entry.detail}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Claim Detail Page ─────────────────────────────────────────────────────────
function ClaimDetailPage({ claim, onBack, onAction, onUndoAction }) {
  const docKeys = Object.keys(claim.docs);
  const [activeDoc, setActiveDoc] = useState(docKeys[0] || 'FNOL');
  const [activeEvId, setActiveEvId] = useState(null);
  const [actionTaken, setActionTaken] = useState(
    ['confirmed', 'rejected', 'deferred', 'gather'].includes(claim.status) ? claim.status : null
  );

  const handleAction = (claimId, notes, decision, reviewerName) => {
    setActionTaken(decision);
    onAction(claimId, notes, decision, reviewerName);
  };

  const handleUndo = () => {
    setActionTaken(null);
    onUndoAction(claim.id);
  };

  const handleEvidenceClick = (evId, docKey) => {
    if (docKey && docKeys.includes(docKey)) setActiveDoc(docKey);
    setActiveEvId(prev => prev === evId ? null : evId);
  };

  const PANE_HEIGHT = 'calc(100vh - 56px - 48px)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Breadcrumb */}
      <div style={{
        height: '48px', display: 'flex', alignItems: 'center', gap: '8px',
        padding: '0 24px', borderBottom: '1px solid #E5E7EB', background: '#fff', flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 12px', border: '1px solid #D1D5DB', borderRadius: '5px',
          background: '#fff', color: '#374151', fontSize: '13px', fontWeight: '500',
          cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#9CA3AF'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
        >
          ← Back to Queue
        </button>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span style={{ fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", color: '#1F2937', fontWeight: '500' }}>
          {claim.id}
        </span>
        <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '4px' }}>
          {claim.lob} · {claim.fnolRelative}
        </span>
        <div style={{ flex: 1 }} />
        {actionTaken && (
          <span style={{
            fontSize: '12px', fontWeight: '600', padding: '3px 10px', borderRadius: '4px',
            background: actionTaken === 'rejected' ? '#FEE2E2' : '#D1FAE5',
            color: actionTaken === 'rejected' ? '#B91C1C' : '#047857',
          }}>
            {actionTaken === 'confirmed' ? '✓ Confirmed' :
             actionTaken === 'rejected'  ? '✗ Rejected' :
             actionTaken === 'deferred'  ? '→ Deferred' : '↗ Info requested'}
          </span>
        )}
      </div>

      {/* Three-pane layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: source docs — 40% */}
        <div style={{ width: '40%', height: PANE_HEIGHT, flexShrink: 0 }}>
          <DocumentPane
            claim={claim}
            activeDoc={activeDoc}
            setActiveDoc={setActiveDoc}
            activeEvId={activeEvId}
            setActiveEvId={setActiveEvId}
          />
        </div>

        {/* Middle: AI assessment — 35% */}
        <div style={{ width: '35%', height: PANE_HEIGHT, flexShrink: 0 }}>
          <AssessmentPane
            claim={claim}
            activeEvId={activeEvId}
            onEvidenceClick={handleEvidenceClick}
          />
        </div>

        {/* Right: actions + audit — 25% */}
        <div style={{ flex: 1, height: PANE_HEIGHT }}>
          <ActionsPane
            claim={claim}
            onAction={handleAction}
            actionTaken={actionTaken}
            onUndo={handleUndo}
          />
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { ClaimDetailPage });
