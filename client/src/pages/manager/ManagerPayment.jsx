import { useState } from 'react';
import { api } from '../../services/api';
import './ManagerPayment.css'; // ⬅️ thêm

export default function ManagerPayment() {
  const [form, setForm] = useState({ bank: '', accountNo: '', accountName: '' });

  const save = async () => {
    await api('/manager/payment-profile', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    alert('Đã lưu');
  };

  return (
    <div className="payment-page">
      <form className="payment-card" onSubmit={(e)=>{e.preventDefault(); save();}}>
        <h2 className="title">Cài đặt thanh toán</h2>

        <label className="field">
          <span>Ngân hàng</span>
          <input
            placeholder="Ví dụ: Vietcombank"
            value={form.bank}
            onChange={e => setForm({ ...form, bank: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Số tài khoản</span>
          <input
            placeholder="0123456789"
            value={form.accountNo}
            onChange={e => setForm({ ...form, accountNo: e.target.value })}
          />
        </label>

        <label className="field">
          <span>Chủ tài khoản</span>
          <input
            placeholder="Nguyễn Văn A"
            value={form.accountName}
            onChange={e => setForm({ ...form, accountName: e.target.value })}
          />
        </label>

        <button className="btn-primary" type="submit">Lưu</button>
      </form>
    </div>
  );
}