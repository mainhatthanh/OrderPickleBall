import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './ManagerPayment.css';

export default function ManagerPayment() {
  const [form, setForm] = useState({ bank: '', accountNo: '', accountName: '', phone: '' });
  const [loading, setLoading] = useState(true);

  // Load existing profile
  useEffect(() => {
    api('/manager/payment-profile')
      .then(data => {
        if (data) {
          setForm({
            bank: data.bank || '',
            accountNo: data.accountNo || '',
            accountName: data.accountName || '',
            phone: data.phone || ''
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    await api('/manager/payment-profile', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    alert('Đã lưu thông tin thanh toán!');
  };

  if (loading) {
    return <div className="payment-page"><p>Đang tải...</p></div>;
  }

  return (
    <div className="payment-page">
      <form className="payment-card" onSubmit={(e)=>{e.preventDefault(); save();}}>
        <h2 className="title">Cài đặt thanh toán</h2>

        <label className="field">
          <span>📞 Số điện thoại liên hệ</span>
          <input
            type="tel"
            placeholder="0901234567"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
          <small>Số điện thoại để khách hàng liên hệ khi cần</small>
        </label>

        <label className="field">
          <span>🏦 Ngân hàng</span>
          <input
            placeholder="Ví dụ: Vietcombank"
            value={form.bank}
            onChange={e => setForm({ ...form, bank: e.target.value })}
          />
        </label>

        <label className="field">
          <span>💳 Số tài khoản</span>
          <input
            placeholder="0123456789"
            value={form.accountNo}
            onChange={e => setForm({ ...form, accountNo: e.target.value })}
          />
        </label>

        <label className="field">
          <span>👤 Chủ tài khoản</span>
          <input
            placeholder="Nguyễn Văn A"
            value={form.accountName}
            onChange={e => setForm({ ...form, accountName: e.target.value })}
          />
        </label>

        <button className="btn-primary" type="submit">💾 Lưu thông tin</button>
      </form>
    </div>
  );
}