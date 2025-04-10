import { Navigate, Outlet } from 'react-router-dom';
import Layout from '../components/Layout';

export default function PrivateRoute() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}