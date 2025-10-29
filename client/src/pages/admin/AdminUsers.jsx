import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { me } from '../../services/auth'; // 👈 thêm

export default function AdminUsers() {
    const [items, setItems] = useState([]);
    const current = me(); // 👈 ai đang đăng nhập
    const load = () => api('/admin/users').then(setItems);
    useEffect(() => { load().catch(console.error); }, []);

    const toggle = async (id) => {
        await api(`/admin/users/${id}/lock-toggle`, { method: 'POST' });
        await load();
    };

    return (
        <div style={{ padding: 16 }}>
            <h2>Quản lý người dùng</h2>
            <table border="1" cellPadding="6">
                <thead><tr><th>ID</th><th>Tên</th><th>Email</th><th>Role</th><th>Locked</th><th>Hành động</th></tr></thead>
                <tbody>
                    {items.map(u => {
                        const disable = u.role === 'admin' || u.id === current?.id; // 👈 chặn nút
                        return (
                            <tr key={u.id}>
                                <td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td>
                                <td>{String(u.locked)}</td>
                                <td>
                                    <button disabled={disable} onClick={() => toggle(u.id)}>
                                        {u.locked ? 'Mở khóa' : 'Khóa'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
