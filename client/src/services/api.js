const API = '/api'; // qua proxy vite -> backend:4000

export async function api(path, opts = {}) {
    const token = localStorage.getItem('token');

    // Nếu body là FormData thì KHÔNG set Content-Type (browser tự set multipart boundary)
    const isForm = (opts.body && typeof FormData !== 'undefined' && opts.body instanceof FormData);

    const headers = {
        ...(opts.headers || {}),
    };

    if (!isForm) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API + path, { ...opts, headers });

    if (!res.ok) {
        let msg = 'Request error';
        try { msg = (await res.json()).message || msg; } catch { }
        throw new Error(msg);
    }
    return res.json();
}
