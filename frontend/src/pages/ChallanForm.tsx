import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Customer, Product } from '../types';

interface Line {
  productId: string;
  quantity: string;
}

export default function ChallanForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: '1' }]);
  const [saving, setSaving] = useState<'draft' | 'confirm' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/customers', { params: { pageSize: 200 } }).then((res) => setCustomers(res.data.items));
    api.get('/products', { params: { pageSize: 200 } }).then((res) => setProducts(res.data.items));
  }, []);

  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function addLine() {
    setLines((ls) => [...ls, { productId: '', quantity: '1' }]);
  }

  function removeLine(index: number) {
    setLines((ls) => ls.filter((_, i) => i !== index));
  }

  function productFor(id: string) {
    return products.find((p) => p.id === id);
  }

  const total = lines.reduce((sum, l) => {
    const p = productFor(l.productId);
    const qty = parseInt(l.quantity, 10) || 0;
    return sum + (p ? Number(p.unitPrice) * qty : 0);
  }, 0);

  async function handleSubmit(e: FormEvent, status: 'DRAFT' | 'CONFIRMED') {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer');
      return;
    }
    const validLines = lines.filter((l) => l.productId && parseInt(l.quantity, 10) > 0);
    if (validLines.length === 0) {
      setError('Add at least one product with a valid quantity');
      return;
    }

    setSaving(status === 'DRAFT' ? 'draft' : 'confirm');
    try {
      const res = await api.post('/challans', {
        customerId,
        status,
        items: validLines.map((l) => ({ productId: l.productId, quantity: parseInt(l.quantity, 10) })),
      });
      navigate(`/challans/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save challan');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>New sales challan</h1>
          <p>Select a customer, add products, then save as Draft or Confirm to reduce stock immediately.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="field" style={{ marginBottom: 18, maxWidth: 420 }}>
          <label>Customer *</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.businessName ? `(${c.businessName})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="section-title" style={{ marginTop: 0 }}>Products</div>

        <div className="challan-item-row" style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600, textTransform: 'uppercase' }}>
          <div>Product</div><div>Available stock</div><div>Unit price</div><div>Qty</div><div></div>
        </div>

        {lines.map((line, i) => {
          const p = productFor(line.productId);
          const qty = parseInt(line.quantity, 10) || 0;
          const insufficient = p ? qty > p.currentStock : false;
          return (
            <div key={i} className="challan-item-row">
              <select value={line.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)}>
                <option value="">Select product…</option>
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.name} ({prod.sku})</option>
                ))}
              </select>
              <div style={{ fontSize: 13, color: insufficient ? 'var(--red)' : 'var(--ink-600)' }}>
                {p ? `${p.currentStock} units` : '—'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-600)' }}>{p ? `₹${Number(p.unitPrice).toFixed(2)}` : '—'}</div>
              <input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                style={{ padding: '8px 10px', border: `1px solid ${insufficient ? 'var(--red)' : 'var(--ink-200)'}`, borderRadius: 6 }} />
              <button type="button" className="remove-line" onClick={() => removeLine(i)} disabled={lines.length === 1}>×</button>
            </div>
          );
        })}

        <button type="button" className="btn btn-outline btn-sm" onClick={addLine} style={{ marginTop: 6 }}>+ Add product line</button>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ink-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-600)' }}>
            Estimated total: <strong style={{ color: 'var(--ink-900)', fontSize: 16 }}>₹{total.toFixed(2)}</strong>
          </div>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button className="btn btn-outline" onClick={(e) => handleSubmit(e, 'DRAFT')} disabled={saving !== null}>
              {saving === 'draft' ? 'Saving…' : 'Save as Draft'}
            </button>
            <button className="btn btn-success" onClick={(e) => handleSubmit(e, 'CONFIRMED')} disabled={saving !== null}>
              {saving === 'confirm' ? 'Confirming…' : 'Confirm & reduce stock'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
