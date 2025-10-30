import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { me } from '../../services/auth';
import './AdminUsers.css'; // ⬅️ thêm

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const current = me();
  const load = () => api('/admin/users').then(setItems);
  useEffect(() => { load().catch(console.error); }, []);

  const toggle = async (id) => {
    await api(`/admin/users/${id}/lock-toggle`, { method: 'POST' });
    await load();
  };

  return (
    <div className="users-page">
      <h2 className="page-title">Quản lý người dùng</h2>

      <div className="users-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th><th>Tên</th><th>Email</th><th>Role</th><th>Locked</th><th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map(u => {
              const disable = u.role === 'admin' || u.id === current?.id;
              return (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge role-${u.role}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.locked ? 'lock-true' : 'lock-false'}`}>{String(u.locked)}</span></td>
                  <td>
                    <button
                      className={`btn ${u.locked ? 'btn-success' : 'btn-danger'}`}
                      disabled={disable}
                      onClick={() => toggle(u.id)}
                      title={disable ? 'Không thể thao tác với admin / chính bạn' : ''}
                    >
                      {u.locked ? 'Mở khóa' : 'Khóa'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}