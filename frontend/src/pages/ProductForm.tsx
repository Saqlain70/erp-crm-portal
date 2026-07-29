import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

const emptyForm = { name: '', sku: '', category: '', unitPrice: '', currentStock: '0', minStockAlertQty: '0', location: '' };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${id}`).then((res) => {
      const p = res.data;
      setForm({
        name: p.name, sku: p.sku, category: p.category || '',
        unitPrice: String(p.unitPrice), currentStock: String(p.currentStock),
        minStockAlertQty: String(p.minStockAlertQty), location: p.location || '',
      });
      setLoading(false);
    });
  }, [id, isEdit]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        unitPrice: parseFloat(form.unitPrice),
        currentStock: parseInt(form.currentStock, 10),
        minStockAlertQty: parseInt(form.minStockAlertQty, 10),
      };
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        navigate(`/products/${id}`);
      } else {
        const res = await api.post('/products', payload);
        navigate(`/products/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit product' : 'Add product'}</h1>
          <p>{isEdit ? 'Update product details.' : 'Add a new product to inventory.'}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Product name *</label>
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="field">
              <label>SKU / code *</label>
              <input required value={form.sku} onChange={(e) => update('sku', e.target.value)} disabled={isEdit} />
            </div>
            <div className="field">
              <label>Category</label>
              <input value={form.category} onChange={(e) => update('category', e.target.value)} />
            </div>
            <div className="field">
              <label>Unit price (₹) *</label>
              <input required type="number" step="0.01" min="0" value={form.unitPrice} onChange={(e) => update('unitPrice', e.target.value)} />
            </div>
            {isEdit ? (
              <div className="field">
                <label>Current stock</label>
                <input type="text" value={`${form.currentStock} units`} disabled style={{ color: 'var(--ink-600)', background: 'var(--ink-50)' }} />
                <span style={{ fontSize: 11, color: 'var(--ink-400)' }}>Adjust stock from the product detail page.</span>
              </div>
            ) : (
              <div className="field">
                <label>Opening stock</label>
                <input type="number" min="0" value={form.currentStock} onChange={(e) => update('currentStock', e.target.value)} />
              </div>
            )}
            <div className="field">
              <label>Minimum stock alert qty</label>
              <input type="number" min="0" value={form.minStockAlertQty} onChange={(e) => update('minStockAlertQty', e.target.value)} />
            </div>
            <div className="field full">
              <label>Warehouse / location</label>
              <input value={form.location} onChange={(e) => update('location', e.target.value)} />
            </div>
          </div>

          <div className="btn-row">
            <button className="btn btn-amber" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
            <button className="btn btn-outline" type="button" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
