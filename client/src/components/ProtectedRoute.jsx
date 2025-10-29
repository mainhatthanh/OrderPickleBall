import { Navigate } from 'react-router-dom';
import { me } from '../services/auth';

export default function ProtectedRoute({ children, roles }) {
    const user = me();
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
    return children;
}
