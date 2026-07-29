import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Product, Paginated } from '../types';
import { StockBadge } from '../components/Badges';
import { useAuth } from '../context/AuthContext';

export default function ProductList() {
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get('/products', { params: { search: search || undefined, lowStock: lowStockOnly ? 'true' : undefined, pageSize: 50 } })
        .then((res) => setData(res.data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, lowStockOnly]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Products &amp; Stock</h1>
          <p>Manage inventory levels and stock movements.</p>
        </div>
        {canEdit && <button className="btn btn-amber" onClick={() => navigate('/products/new')}>+ Add product</button>}
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-600)' }}>
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <div className="data-table-wrap">
        {loading ? (
          <div className="loading-state">Loading products…</div>
        ) : !data || data.items.length === 0 ? (
          <div className="empty-state">No products found.</div>
        ) : (
          <table>
            <thead>
              <tr><th>Product</th><th>SKU</th><th>Category</th><th>Unit price</th><th>Stock</th><th>Location</th><th></th></tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/products/${p.id}`)}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.sku}</td>
                  <td>{p.category || '—'}</td>
                  <td>₹{Number(p.unitPrice).toFixed(2)}</td>
                  <td>{p.currentStock}</td>
                  <td>{p.location || '—'}</td>
                  <td><StockBadge current={p.currentStock} min={p.minStockAlertQty} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
