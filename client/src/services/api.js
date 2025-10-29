const API = '/api'; // qua proxy vite -> backend:4000

export async function api(path, opts = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API + path, { ...opts, headers });
    if (!res.ok) {
        let msg = 'Request error';
        try { msg = (await res.json()).message || msg; } catch { }
        throw new Error(msg);
    }
    return res.json();
}
