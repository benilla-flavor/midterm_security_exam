/**
 * ADMIN: AUDIT LOG
 * Security events recorded by the server: sign-ins, failures, denied access and
 * every access to health records. The log never contains passwords or tokens.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { Notice, Loading, Empty } from '../../components/Stationery';
import PageHead from '../../components/PageHead';
import { apiError, formatDateTime } from '../../lib/format';

const PAGE_SIZE = 50;

// Events that deserve a second look are printed in stamp red.
const ALERT_ACTIONS = new Set(['FAILED_LOGIN', 'FAILED_AUTH', 'ACCESS_DENIED', 'PHI_ACCESS_DENIED']);
const PHI_ACTIONS = new Set(['PHI_ACCESSED', 'MEDICAL_RECORD_CREATED']);

function actionTone(action) {
  if (ALERT_ACTIONS.has(action)) return 'alert';
  if (PHI_ACTIONS.has(action)) return 'phi';
  return 'plain';
}

function describe(details) {
  if (!details) return '';
  if (details.message) return details.message;
  return Object.entries(details).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ');
}

export default function AdminAudit() {
  const [logs, setLogs] = useState(null);
  const [users, setUsers] = useState([]);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (nextOffset = offset) => {
    setLoading(true);
    setError('');
    try {
      const [logRes, userRes] = await Promise.all([
        api.get('/admin/audit-log', { params: { limit: PAGE_SIZE, offset: nextOffset } }),
        users.length ? Promise.resolve(null) : api.get('/admin/users')
      ]);
      setLogs(logRes.data.logs);
      if (userRes) setUsers(userRes.data.users);
      setOffset(nextOffset);
    } catch (err) {
      setError(apiError(err, 'Could not load the audit log.'));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(0); }, []);

  const emailOf = useMemo(() => Object.fromEntries(users.map((u) => [u.user_id, u.email])), [users]);
  const actions = useMemo(() => [...new Set((logs || []).map((l) => l.action))].sort(), [logs]);
  const shown = (logs || []).filter((l) => filter === 'all' || l.action === filter);

  return (
    <div className="page">
      <PageHead
        title="Audit log"
        lede="What the server recorded, newest first. Red entries are failed sign-ins and denied access."
        actions={
          <button type="button" className="btn btn-line" onClick={() => load(offset)} disabled={loading}>
            <RefreshCw aria-hidden="true" /> Refresh
          </button>
        }
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!logs && !error && <Loading label="Loading the audit log" />}

      {logs && (
        <>
          <div className="toolbar">
            <div className="field filter-field">
              <label htmlFor="action-filter">Event</label>
              <select id="action-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All events on this page</option>
                {actions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="pager">
              <span className="caption serial">Entries {offset + 1}–{offset + logs.length}</span>
              <button type="button" className="btn btn-line btn-sm" onClick={() => load(Math.max(0, offset - PAGE_SIZE))} disabled={loading || offset === 0}>
                <ChevronLeft aria-hidden="true" /> Newer
              </button>
              <button type="button" className="btn btn-line btn-sm" onClick={() => load(offset + PAGE_SIZE)} disabled={loading || logs.length < PAGE_SIZE}>
                Older <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>

          {shown.length ? (
            <div className="sheet ledger-sheet">
              <div className="ledger-scroll">
                <table className="ledger audit-ledger">
                  <thead>
                    <tr>
                      <th scope="col">When</th>
                      <th scope="col">Event</th>
                      <th scope="col">Account</th>
                      <th scope="col">Resource</th>
                      <th scope="col">Address</th>
                      <th scope="col">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((log) => (
                      <tr key={log.log_id} data-tone={actionTone(log.action)}>
                        <td className="num">{formatDateTime(log.created_at)}</td>
                        <td><span className={`event event--${actionTone(log.action)}`}>{log.action}</span></td>
                        <td>{log.user_id ? (emailOf[log.user_id] || <span className="serial">{log.user_id.slice(0, 8)}…</span>) : <span className="muted">No account</span>}</td>
                        <td>{log.resource_type || <span className="muted">—</span>}</td>
                        <td className="num serial">{log.ip_address || '—'}</td>
                        <td className="cell-details">{describe(log.details)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Empty title="No events of this kind on this page">Choose another event, or page to older entries.</Empty>
          )}
        </>
      )}
    </div>
  );
}
