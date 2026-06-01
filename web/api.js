// Thin same-origin API client for the FastAPI backend.
// Loaded after data.js so window.CLAIMS / window.AUDIT_LOG_INIT survive as a
// fallback if the backend is unreachable.
(function () {
  async function jsonFetch(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    return res.json();
  }

  function post(url, body) {
    return jsonFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  window.API = {
    getState() {
      return jsonFetch('/api/state');
    },
    analyze(template) {
      return post('/api/analyze', { template });
    },
    action(claimId, decision, notes, reviewerName) {
      return post(`/api/claims/${encodeURIComponent(claimId)}/action`, { decision, notes, reviewerName });
    },
    undo(claimId, reviewerName) {
      return post(`/api/claims/${encodeURIComponent(claimId)}/undo`, { reviewerName });
    },
    reset() {
      return post('/api/reset');
    },
  };
})();
