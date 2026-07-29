import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { Customer } from '../types';
import { StatusBadge } from '../components/Badges';
import { useAuth } from '../context/AuthContext';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.get(`/customers/${id}`).then((res) => setCustomer(res.data));
  }

  useEffect(load, [id]);

  async function handleAddFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.post(`/customers/${id}/follow-ups`, { note, followUpDate: followUpDate || undefined });
      setNote('');
      setFollowUpDate('');
      load();
    } finally {
      setSaving(false);
    }
  }

  if (!customer) return <div className="loading-state">Loading customer…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{customer.name}</h1>
          <p>{customer.businessName || 'Individual customer'} · {customer.mobile}</p>
        </div>
        {canEdit && <button className="btn btn-outline" onClick={() => navigate(`/customers/${id}/edit`)}>Edit</button>}
      </div>

      <div className="detail-grid">
        <div>
          <div className="section-title">Details</div>
          <div className="card">
            <div className="kv-row"><span className="k">Status</span><span className="v"><StatusBadge status={customer.status} /></span></div>
            <div className="kv-row"><span className="k">Type</span><span className="v">{customer.customerType}</span></div>
            <div className="kv-row"><span className="k">Email</span><span className="v">{customer.email || '—'}</span></div>
            <div className="kv-row"><span className="k">GST number</span><span className="v">{customer.gstNumber || '—'}</span></div>
            <div className="kv-row"><span className="k">Address</span><span className="v">{customer.address || '—'}</span></div>
            <div className="kv-row"><span className="k">Next follow-up</span><span className="v">{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : '—'}</span></div>
            {customer.notes && <div className="kv-row"><span className="k">Notes</span><span className="v">{customer.notes}</span></div>}
          </div>

          <div className="section-title">Sales challans</div>
          <div className="data-table-wrap">
            {!customer.challans || customer.challans.length === 0 ? (
              <div className="empty-state">No challans for this customer yet.</div>
            ) : (
              <table>
                <thead><tr><th>Challan #</th><th>Qty</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {customer.challans.map((c) => (
                    <tr key={c.id} onClick={() => navigate(`/challans/${c.id}`)}>
                      <td>{c.challanNumber}</td>
                      <td>{c.totalQuantity}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <div className="section-title">Follow-up notes</div>
          {canEdit && (
            <div className="card" style={{ marginBottom: 16 }}>
              <form onSubmit={handleAddFollowUp}>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Add a note</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called about reorder, promised delivery by Friday…" />
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Next follow-up date (optional)</label>
                  <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <button className="btn btn-amber btn-sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add note'}</button>
              </form>
            </div>
          )}

          <div className="card">
            {!customer.followUps || customer.followUps.length === 0 ? (
              <p style={{ color: 'var(--ink-400)', margin: 0, fontSize: 13 }}>No follow-up notes yet.</p>
            ) : (
              customer.followUps.map((f) => (
                <div key={f.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--ink-50)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 13 }}>{f.note}</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-400)' }}>
                    {f.createdBy?.name} · {new Date(f.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
