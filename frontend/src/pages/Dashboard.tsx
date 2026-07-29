import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Product, SalesChallan } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentChallans, setRecentChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [customersRes, lowStockRes, challansRes] = await Promise.all([
          api.get('/customers', { params: { pageSize: 1 } }),
          api.get('/products', { params: { lowStock: 'true' } }),
          api.get('/challans', { params: { pageSize: 5 } }),
        ]);
        setCustomerCount(customersRes.data.pagination.total);
        setLowStock(lowStockRes.data.items);
        setRecentChallans(challansRes.data.items);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loading-state">Loading dashboard…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name.split(' ')[0]}</h1>
          <p>Here's what's happening across the operations portal today.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total customers</div>
          <div className="value">{customerCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Low stock items</div>
          <div className="value accent">{lowStock.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Recent challans</div>
          <div className="value">{recentChallans.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Your role</div>
          <div className="value" style={{ fontSize: 18 }}>{user?.role}</div>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="section-title">Recent sales challans</div>
          <div className="data-table-wrap">
            {recentChallans.length === 0 ? (
              <div className="empty-state">No challans created yet.</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Challan #</th><th>Customer</th><th>Qty</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentChallans.map((c) => (
                    <tr key={c.id} onClick={() => (window.location.href = `/challans/${c.id}`)}>
                      <td>{c.challanNumber}</td>
                      <td>{(c.customer as any)?.name}</td>
                      <td>{c.totalQuantity}</td>
                      <td><span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <div className="section-title">Low stock alerts</div>
          <div className="card">
            {lowStock.length === 0 ? (
              <p style={{ color: 'var(--ink-400)', margin: 0, fontSize: 13 }}>All products are above their minimum stock level.</p>
            ) : (
              lowStock.map((p) => (
                <div key={p.id} className="kv-row">
                  <span className="k">{p.name}</span>
                  <span className="v" style={{ color: 'var(--red)' }}>{p.currentStock} left</span>
                </div>
              ))
            )}
            <Link to="/products" className="btn btn-outline btn-sm" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
              View all products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
