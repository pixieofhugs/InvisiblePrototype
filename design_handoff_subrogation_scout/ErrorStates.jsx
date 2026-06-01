// Error state samples — Subrogation Opportunity Scout

function ErrorStatesPage() {

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '40px' }}>
      <div style={{
        fontSize: '11px', fontWeight: '700', color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB',
      }}>{title}</div>
      {children}
    </div>
  );

  // ── 1. Service Unavailable ────────────────────────────────────────────────
  const ServiceUnavailable = () => (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden',
    }}>
      {/* Simulated topbar */}
      <div style={{
        height: '56px', borderBottom: '1px solid #E5E7EB', background: '#fff',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px',
        opacity: 0.4,
      }}>
        <span style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>Subrogation Opportunity Scout</span>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '72px 40px', textAlign: 'center',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '20px', color: '#9CA3AF' }}>⚠</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
          Service unavailable
        </div>
        <div style={{ fontSize: '14px', color: '#6B7280', maxWidth: '420px', lineHeight: '1.6', marginBottom: '24px' }}>
          The scout service is temporarily unreachable. Your session and queue data are preserved.
          Contact IT support if this persists beyond 15 minutes.
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{
            padding: '8px 18px', background: '#1F2937', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}>Try again</button>
          <button style={{
            padding: '8px 18px', background: '#fff', color: '#6B7280',
            border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
          }}>Contact support</button>
        </div>
        <div style={{ marginTop: '24px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#D1D5DB' }}>
          Status: HTTP 503 · 2026-05-29 09:41 UTC
        </div>
      </div>
    </div>
  );

  // ── 2. Session Expired ────────────────────────────────────────────────────
  const SessionExpired = () => (
    <div style={{ position: 'relative' }}>
      {/* Blurred background queue */}
      <div style={{
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px',
        padding: '24px', filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none',
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            height: '76px', background: '#F9FAFB', borderRadius: '8px',
            marginBottom: '6px', border: '1px solid #E5E7EB',
          }} />
        ))}
      </div>
      {/* Modal overlay */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(249,250,251,0.7)',
      }}>
        <div style={{
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px',
          padding: '28px 32px', width: '360px', textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Your session has expired
          </div>
          <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', marginBottom: '20px' }}>
            You've been signed out after 60 minutes of inactivity.
            Sign back in to continue reviewing your queue.
          </div>
          <button style={{
            width: '100%', padding: '9px', background: '#1F2937', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}>Sign in again</button>
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#9CA3AF' }}>
            Your queue position and notes are saved.
          </div>
        </div>
      </div>
    </div>
  );

  // ── 3. Model Run Timeout ──────────────────────────────────────────────────
  const ModelTimeout = () => (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px',
      padding: '0', overflow: 'hidden',
    }}>
      {/* Banner */}
      <div style={{
        background: '#FFFBEB', borderBottom: '1px solid #FCD34D',
        padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '13px', color: '#92400E' }}>⚠</span>
        <span style={{ fontSize: '13px', color: '#78350F', fontWeight: '500' }}>
          1 claim stalled in analysis — model run exceeded 30s timeout.
        </span>
        <button style={{
          marginLeft: 'auto', fontSize: '12px', color: '#B45309',
          background: 'none', border: '1px solid #FCD34D', borderRadius: '4px',
          padding: '3px 10px', cursor: 'pointer', fontWeight: '500',
        }}>Retry all stalled</button>
      </div>
      {/* Stalled claim row */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '16px 20px', gap: '16px',
        borderBottom: '1px solid #F3F4F6',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: '#F3F4F6', border: '2px dashed #D1D5DB',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: '18px', color: '#9CA3AF' }}>…</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#374151', fontWeight: '500' }}>CLM-2026-00493</div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Personal auto · Just now</div>
        </div>
        <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>Awaiting model output…</div>
        <button style={{
          fontSize: '12px', color: '#374151', background: '#F9FAFB',
          border: '1px solid #E5E7EB', borderRadius: '4px', padding: '5px 12px', cursor: 'pointer',
        }}>Retry</button>
      </div>
      <div style={{ padding: '12px 20px' }}>
        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
          Timeout threshold: 30s · Last attempted: 2026-05-29 09:38 UTC
        </div>
      </div>
    </div>
  );

  // ── 4. Document Unavailable (in-pane) ─────────────────────────────────────
  const DocumentUnavailable = () => (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden',
    }}>
      {/* Tab strip */}
      <div style={{
        display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB',
      }}>
        {['FNOL', 'Police Report', 'Repair Estimate'].map((tab, i) => (
          <div key={tab} style={{
            padding: '10px 16px', fontSize: '13px',
            borderBottom: i === 1 ? '2px solid #1F2937' : '2px solid transparent',
            fontWeight: i === 1 ? '600' : '400',
            color: i === 1 ? '#111827' : '#9CA3AF',
          }}>{tab}</div>
        ))}
      </div>
      {/* Error state */}
      <div style={{
        padding: '56px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '8px',
          background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '14px',
        }}>
          <span style={{ fontSize: '18px', color: '#9CA3AF' }}>⛔</span>
        </div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
          Document unavailable
        </div>
        <div style={{ fontSize: '13px', color: '#9CA3AF', maxWidth: '320px', lineHeight: '1.6', marginBottom: '18px' }}>
          The Police Report for this claim could not be retrieved from the document store.
          The file may still be processing or was not uploaded.
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{
            padding: '7px 14px', fontSize: '12px', background: '#F9FAFB',
            border: '1px solid #E5E7EB', borderRadius: '5px', cursor: 'pointer', color: '#374151',
          }}>Retry fetch</button>
          <button style={{
            padding: '7px 14px', fontSize: '12px', background: '#fff',
            border: '1px solid #E5E7EB', borderRadius: '5px', cursor: 'pointer', color: '#9CA3AF',
          }}>Upload manually</button>
        </div>
      </div>
    </div>
  );

  // ── 5. Permission Denied ──────────────────────────────────────────────────
  const PermissionDenied = () => (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '64px 40px', textAlign: 'center',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '20px', color: '#B91C1C' }}>✕</span>
      </div>
      <div style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
        Access denied
      </div>
      <div style={{ fontSize: '14px', color: '#6B7280', maxWidth: '400px', lineHeight: '1.6', marginBottom: '8px' }}>
        You don't have permission to view claim{' '}
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#374151' }}>CLM-2026-00487</span>.
        This claim is assigned to a senior reviewer.
      </div>
      <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '24px' }}>
        Contact your supervisor or submit an access request.
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button style={{
          padding: '8px 18px', background: '#fff', color: '#374151',
          border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
        }}>← Back to Queue</button>
        <button style={{
          padding: '8px 18px', background: '#1F2937', color: '#fff',
          border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
        }}>Request access</button>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#FAFAF9' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 28px 48px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>Error States</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
            Sample screens for system failures, access issues, and data errors.
          </p>
        </div>
        <Section title="1 — Service unavailable (HTTP 503)">
          <ServiceUnavailable />
        </Section>
        <Section title="2 — Session expired">
          <SessionExpired />
        </Section>
        <Section title="3 — Model run timeout with retry banner">
          <ModelTimeout />
        </Section>
        <Section title="4 — Document unavailable in source pane">
          <DocumentUnavailable />
        </Section>
        <Section title="5 — Permission denied (senior-assigned claim)">
          <PermissionDenied />
        </Section>
      </div>
    </div>
  );
}

Object.assign(window, { ErrorStatesPage });
