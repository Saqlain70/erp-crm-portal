import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { SalesChallan, Paginated } from '../types';
import { StatusBadge } from '../components/Badges';
import { useAuth } from '../context/AuthContext';

export default function ChallanList() {
  const [data, setData] = useState<Paginated<SalesChallan> | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  useEffect(() => {
    setLoading(true);
    api.get('/challans', { params: { status: status || undefined, pageSize: 50 } })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales Challans</h1>
          <p>Draft, confirm, and track outgoing shipments.</p>
        </div>
        {canCreate && <button className="btn btn-amber" onClick={() => navigate('/challans/new')}>+ New challan</button>}
      </div>

      <div className="toolbar">
        <select className="search-input" style={{ minWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="data-table-wrap">
        {loading ? (
          <div className="loading-state">Loading challans…</div>
        ) : !data || data.items.length === 0 ? (
          <div className="empty-state">No challans found.</div>
        ) : (
          <table>
            <thead><tr><th>Challan #</th><th>Customer</th><th>Items</th><th>Total qty</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/challans/${c.id}`)}>
                  <td><strong>{c.challanNumber}</strong></td>
                  <td>{(c.customer as any)?.name}</td>
                  <td>{c.items?.length ?? 0}</td>
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
  );
}
