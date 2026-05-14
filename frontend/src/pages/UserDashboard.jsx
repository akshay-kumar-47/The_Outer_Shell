import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Package } from 'lucide-react';
import './Auth.css';

const UserDashboard = () => {
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/orders/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="dashboard-page fade-in container">
      <div className="dashboard-header">
        <div>
          <h1>My Account</h1>
          <p>Welcome back, {user?.username}</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="dashboard-content">
        <h2>Order History</h2>
        {orders.length === 0 ? (
          <div className="empty-state glass" style={{ padding: '40px', textAlign: 'center', marginTop: '20px', borderRadius: '12px' }}>
            <Package size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
            <p>You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="order-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-meta">
                    <strong>Order #{order.id}</strong>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="order-status">
                    <span className="status-badge">{order.status}</span>
                  </div>
                </div>
                <div className="order-details">
                  <p><strong>Shipping To:</strong> {order.customer_name}</p>
                  <p>{order.address}</p>
                  <div className="order-amount" style={{ marginTop: '16px' }}>
                    Total: ₹{Number(order.total_amount).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
