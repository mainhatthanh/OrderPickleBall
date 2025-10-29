import { useState } from 'react';
import { api } from '../../services/api';

export default function ManagerPayment() {
    const [form, setForm] = useState({ bank: '', accountNo: '', accountName: '' });
    const save = async () => { await api('/manager/payment-profile', { method: 'POST', body: JSON.stringify(form) }); alert('Đã lưu'); };
    return (
        <div style={{ padding: 16, maxWidth: 420 }}>
            <h2>Cài đặt thanh toán</h2>
            <input placeholder="Ngân hàng" value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
            <input placeholder="Số tài khoản" value={form.accountNo} onChange={e => setForm({ ...form, accountNo: e.target.value })} />
            <input placeholder="Chủ tài khoản" value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} />
            <button onClick={save}>Lưu</button>
        </div>
    );
}
