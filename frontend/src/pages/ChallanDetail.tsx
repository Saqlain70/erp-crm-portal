import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { SalesChallan } from '../types';
import { StatusBadge } from '../components/Badges';
import { useAuth } from '../context/AuthContext';

export default function ChallanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAct = user?.role === 'ADMIN' || user?.role === 'SALES';
  const [challan, setChallan] = useState<SalesChallan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.get(`/challans/${id}`).then((res) => setChallan(res.data));
  }

  useEffect(load, [id]);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/challans/${id}/confirm`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm challan');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel this challan? If confirmed, stock will be restored.')) return;
    setBusy(true);
    setError(null);
    try {
      await api.post(`/challans/${id}/cancel`);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel challan');
    } finally {
      setBusy(false);
    }
  }

  if (!challan) return <div className="loading-state">Loading challan…</div>;

  const total = challan.items.reduce((sum, i) => sum + Number(i.lineTotal), 0);
  const customerName = (challan.customer as any)?.name || 'Unknown';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{challan.challanNumber}</h1>
          <p>{customerName} · Created {new Date(challan.createdAt).toLocaleString()}</p>
        </div>
        <StatusBadge status={challan.status} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Unit price</th><th>Qty</th><th>Line total</th></tr>
          </thead>
          <tbody>
            {challan.items.map((item) => (
              <tr key={item.id} style={{ cursor: 'default' }}>
                <td>{item.productNameSnap}</td>
                <td>{item.productSkuSnap}</td>
                <td>₹{Number(item.unitPriceSnap).toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>₹{Number(item.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: 'right', marginTop: 14, fontSize: 15 }}>
          Total: <strong>₹{total.toFixed(2)}</strong>
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 0 }}>
        {canAct && challan.status === 'DRAFT' && (
          <button className="btn btn-success" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Confirming…' : 'Confirm challan (reduce stock)'}
          </button>
        )}
        {canAct && challan.status !== 'CANCELLED' && (
          <button className="btn btn-danger" onClick={handleCancel} disabled={busy}>
            {busy ? 'Cancelling…' : 'Cancel challan'}
          </button>
        )}
        <button className="btn btn-outline" onClick={() => navigate('/challans')}>Back to list</button>
      </div>
    </div>
  );
}
