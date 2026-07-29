import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

const emptyForm = {
  name: '', mobile: '', email: '', businessName: '', gstNumber: '',
  customerType: 'RETAIL', address: '', status: 'LEAD', followUpDate: '', notes: '',
};

export default function CustomerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/customers/${id}`).then((res) => {
      const c = res.data;
      setForm({
        name: c.name || '', mobile: c.mobile || '', email: c.email || '',
        businessName: c.businessName || '', gstNumber: c.gstNumber || '',
        customerType: c.customerType, address: c.address || '', status: c.status,
        followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '', notes: c.notes || '',
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
      if (isEdit) {
        await api.put(`/customers/${id}`, form);
        navigate(`/customers/${id}`);
      } else {
        const res = await api.post('/customers', form);
        navigate(`/customers/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit customer' : 'Add customer'}</h1>
          <p>{isEdit ? 'Update customer details.' : 'Create a new lead or customer record.'}</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Customer name *</label>
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="field">
              <label>Mobile number *</label>
              <input required value={form.mobile} onChange={(e) => update('mobile', e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="field">
              <label>Business name</label>
              <input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} />
            </div>
            <div className="field">
              <label>GST number (optional)</label>
              <input value={form.gstNumber} onChange={(e) => update('gstNumber', e.target.value)} />
            </div>
            <div className="field">
              <label>Customer type *</label>
              <select value={form.customerType} onChange={(e) => update('customerType', e.target.value)}>
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="field">
              <label>Follow-up date</label>
              <input type="date" value={form.followUpDate} onChange={(e) => update('followUpDate', e.target.value)} />
            </div>
            <div className="field full">
              <label>Address</label>
              <input value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div className="field full">
              <label>Notes</label>
              <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </div>
          </div>

          <div className="btn-row">
            <button className="btn btn-amber" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save customer'}</button>
            <button className="btn btn-outline" type="button" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
