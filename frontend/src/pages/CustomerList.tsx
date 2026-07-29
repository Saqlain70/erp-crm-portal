import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Customer, Paginated } from '../types';
import { StatusBadge } from '../components/Badges';
import { useAuth } from '../context/AuthContext';

export default function CustomerList() {
  const [data, setData] = useState<Paginated<Customer> | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get('/customers', { params: { search: search || undefined, status: status || undefined, pageSize: 50 } })
        .then((res) => setData(res.data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage leads, active accounts, and follow-ups.</p>
        </div>
        {canEdit && (
          <button className="btn btn-amber" onClick={() => navigate('/customers/new')}>+ Add customer</button>
        )}
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name, mobile, email, or business…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="search-input" style={{ minWidth: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="data-table-wrap">
        {loading ? (
          <div className="loading-state">Loading customers…</div>
        ) : !data || data.items.length === 0 ? (
          <div className="empty-state">No customers found. Try adjusting your search.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Business</th><th>Mobile</th><th>Type</th><th>Status</th><th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.businessName || '—'}</td>
                  <td>{c.mobile}</td>
                  <td>{c.customerType}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && <p style={{ color: 'var(--ink-400)', fontSize: 12.5, marginTop: 10 }}>{data.pagination.total} total customers</p>}
    </div>
  );
}
