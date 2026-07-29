import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { Product } from '../types';
import { StockBadge } from '../components/Badges';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState('');
  const [movementType, setMovementType] = useState('IN');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get(`/products/${id}`).then((res) => setProduct(res.data));
  }

  useEffect(load, [id]);

  async function handleAdjust(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post(`/products/${id}/stock-movements`, { quantity: parseInt(qty, 10), movementType, reason });
      setQty('');
      setReason('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  }

  if (!product) return <div className="loading-state">Loading product…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{product.name}</h1>
          <p>SKU: {product.sku} · {product.category || 'Uncategorized'}</p>
        </div>
        {canEdit && <button className="btn btn-outline" onClick={() => navigate(`/products/${id}/edit`)}>Edit</button>}
      </div>

      <div className="detail-grid">
        <div>
          <div className="section-title">Details</div>
          <div className="card">
            <div className="kv-row"><span className="k">Unit price</span><span className="v">₹{Number(product.unitPrice).toFixed(2)}</span></div>
            <div className="kv-row"><span className="k">Current stock</span><span className="v">{product.currentStock}</span></div>
            <div className="kv-row"><span className="k">Min alert quantity</span><span className="v">{product.minStockAlertQty}</span></div>
            <div className="kv-row"><span className="k">Location</span><span className="v">{product.location || '—'}</span></div>
            <div className="kv-row"><span className="k">Status</span><span className="v"><StockBadge current={product.currentStock} min={product.minStockAlertQty} /></span></div>
          </div>

          <div className="section-title">Stock movement log</div>
          <div className="data-table-wrap">
            {!product.stockMovements || product.stockMovements.length === 0 ? (
              <div className="empty-state">No stock movements recorded yet.</div>
            ) : (
              <table>
                <thead><tr><th>Type</th><th>Qty</th><th>Reason</th><th>By</th><th>Date</th></tr></thead>
                <tbody>
                  {product.stockMovements.map((m) => (
                    <tr key={m.id}>
                      <td><span className={`badge ${m.movementType === 'IN' ? 'badge-ok' : 'badge-low'}`}>{m.movementType}</span></td>
                      <td>{m.quantity}</td>
                      <td>{m.reason}</td>
                      <td>{m.createdBy?.name || '—'}</td>
                      <td>{new Date(m.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {canEdit && (
          <div>
            <div className="section-title">Adjust stock</div>
            <div className="card">
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleAdjust}>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Movement type</label>
                  <select value={movementType} onChange={(e) => setMovementType(e.target.value)}>
                    <option value="IN">Stock IN</option>
                    <option value="OUT">Stock OUT</option>
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Quantity</label>
                  <input type="number" min="1" required value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Reason</label>
                  <input required placeholder="Restock, damage, correction…" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <button className="btn btn-amber btn-sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record movement'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
