import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Login from './pages/Login';
import CourtDetail from './pages/CourtDetail';
import Checkout from './pages/Checkout';
import MyBookings from './pages/MyBookings';
import AdminPendingCourts from './pages/admin/AdminPendingCourts';
import AdminStats from './pages/admin/AdminStats';
import ManagerCourts from './pages/manager/ManagerCourts';
import ManagerOrders from './pages/manager/ManagerOrders';
import ManagerPayment from './pages/manager/ManagerPayment';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUsers from './pages/admin/AdminUsers';
import Register from './pages/Register.jsx';


export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/court/:id" element={<CourtDetail />} />
        <Route path="/checkout/:bookingId" element={<Checkout />} />
        <Route path="/my-bookings" element={<ProtectedRoute roles={['user']}><MyBookings /></ProtectedRoute>} />
        <Route path="/admin/pending-courts" element={<ProtectedRoute roles={['admin']}><AdminPendingCourts /></ProtectedRoute>} />
        <Route path="/admin/stats" element={<ProtectedRoute roles={['admin']}><AdminStats /></ProtectedRoute>} />
        <Route path="/manager/courts" element={<ProtectedRoute roles={['manager']}><ManagerCourts /></ProtectedRoute>} />
        <Route path="/manager/orders" element={<ProtectedRoute roles={['manager']}><ManagerOrders /></ProtectedRoute>} />
        <Route path="/manager/payment" element={<ProtectedRoute roles={['manager']}><ManagerPayment /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  );
}

