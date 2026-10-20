/**
 * ADMIN: ACCOUNTS
 * Every user account with its role and state. Deactivating an account blocks its
 * sign-in and its existing tokens on the next request (checked in authenticate()).
 * Each change is written to the audit log by the server.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Stamp, Notice, Loading, Empty } from '../../components/Stationery';
import PageHead from '../../components/PageHead';
import { apiError, formatDateTime } from '../../lib/format';

const ROLES = [
  { value: 'all', label: 'All' },
  { value: 'patient', label: 'Patients' },
  { value: 'doctor', label: 'Doctors' },
  { value: 'admin', label: 'Admins' }
];

function AccountRow({ account, isSelf, onToggle, busy }) {
  const [confirming, setConfirming] = useState(false);
  const deactivate = account.is_active;

  return (
    <tr>
      <td>
        <span className="cell-main">{account.email}</span>
        {isSelf && <span className="cell-sub">You</span>}
      </td>
      <td className="cap-cell">{account.role}</td>
      <td>{account.is_active ? <Stamp status="sealed" label="Active" /> : <Stamp status="cancelled" label="Deactivated" />}</td>
      <td className="num">{formatDateTime(account.created_at)}</td>
      <td className="num">{account.last_login ? formatDateTime(account.last_login) : 'Never'}</td>
      <td>
        {isSelf ? (
          <span className="field-hint">Can't change your own account</span>
        ) : confirming ? (
          <div className="row-actions">
            <button
              type="button"
              className={`btn btn-sm${deactivate ? ' btn-stamp' : ''}`}
              disabled={busy}
              onClick={async () => { await onToggle(account); setConfirming(false); }}
            >
              {busy ? 'Saving…' : deactivate ? 'Yes, deactivate' : 'Yes, reactivate'}
            </button>
            <button type="button" className="text-btn" onClick={() => setConfirming(false)}>Keep</button>
          </div>
        ) : (
          <button type="button" className="btn btn-line btn-sm" onClick={() => setConfirming(true)}>
            {deactivate ? 'Deactivate' : 'Reactivate'}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function AdminAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState(null);
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/admin/users')
    .then((res) => setAccounts(res.data.users))
    .catch((err) => setError(apiError(err, 'Could not load accounts.')));

  useEffect(() => { load(); }, []);

  const toggle = async (account) => {
    setBusyId(account.user_id);
    setNotice('');
    setError('');
    try {
      await api.patch(`/admin/users/${account.user_id}/status`, { isActive: !account.is_active });
      setNotice(`${account.email} is now ${account.is_active ? 'deactivated' : 'active'}. The change is in the audit log.`);
      await load();
    } catch (err) {
      setError(apiError(err, 'The account could not be changed.'));
    } finally {
      setBusyId(null);
    }
  };

  const shown = useMemo(() => (accounts || []).filter((a) =>
    (role === 'all' || a.role === role) && a.email.toLowerCase().includes(query.trim().toLowerCase())
  ), [accounts, role, query]);

  const counts = useMemo(() => Object.fromEntries(ROLES.map((r) => [
    r.value, (accounts || []).filter((a) => r.value === 'all' || a.role === r.value).length
  ])), [accounts]);

  return (
    <div className="page">
      <PageHead
        title="Accounts"
        lede="Everyone who can sign in. Deactivating an account stops its sign-in and its open sessions on their next request."
      />
      {notice && <Notice tone="ok">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {!accounts && !error && <Loading label="Loading accounts" />}

      {accounts && (
        <>
          <div className="toolbar">
            <div className="segmented" role="radiogroup" aria-label="Filter by role">
              {ROLES.map((r) => (
                <label key={r.value} className="segment">
                  <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} />
                  <span>{r.label} <span className="count">{counts[r.value]}</span></span>
                </label>
              ))}
            </div>
            <div className="field search-field">
              <label htmlFor="account-search" className="sr-only">Search by email</label>
              <Search aria-hidden="true" />
              <input id="account-search" type="search" placeholder="Search by email" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>

          {shown.length ? (
            <div className="sheet ledger-sheet">
              <div className="ledger-scroll">
                <table className="ledger">
                  <thead>
                    <tr>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col">State</th>
                      <th scope="col">Created</th>
                      <th scope="col">Last sign-in</th>
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((a) => (
                      <AccountRow
                        key={a.user_id}
                        account={a}
                        isSelf={a.user_id === user.userId}
                        onToggle={toggle}
                        busy={busyId === a.user_id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <Empty title="No accounts match">Try another role or a shorter search.</Empty>
          )}
        </>
      )}
    </div>
  );
}
