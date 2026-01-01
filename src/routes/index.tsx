import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Tenders from '../pages/Tenders';
import Statistics from '../pages/Statistics';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import TenderDetails from '../pages/TenderDetails';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyEmailPending from '../pages/auth/VerifyEmailPending';
import VerifyEmail from '../pages/auth/VerifyEmail';
import TokenLogin from '../pages/auth/TokenLogin';
import PrivateRoute from './PrivateRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmailPending />} />
      <Route path="/auth/token-login" element={<TokenLogin />} />
      <Route path="/token-login" element={<TokenLogin />} />
      {/* Handler for verification link: https://<domain>/auth/verify?token=... */}
      <Route path="/auth/verify" element={<VerifyEmail />} />
      
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tenders" element={<Tenders />} />
        <Route path="/tenders/:id" element={<TenderDetails />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}