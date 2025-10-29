import { api } from './api';

export async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('token', data.token);
    localStorage.setItem('me', JSON.stringify(data.user));
    return data.user;
}
export function me() {
    const raw = localStorage.getItem('me');
    return raw ? JSON.parse(raw) : null;
}
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('me');
}
