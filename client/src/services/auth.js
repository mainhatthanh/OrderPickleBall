import { api } from './api';

// Lưu phiên đăng nhập
export function saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('me', JSON.stringify(user));
}

// Xoá phiên đăng nhập
export function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('me');
}

// Lấy user hiện tại
export function me() {
    const raw = localStorage.getItem('me');
    return raw ? JSON.parse(raw) : null;
}

// Đăng nhập
export async function login(email, password) {
    const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    // backend trả { token, user }
    saveSession(data.token, data.user);
    return data.user;
}

// Đăng xuất
export function logout() {
    clearSession();
}
