import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, ShieldAlert } from 'lucide-react';
import './Auth.css';

const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/orders/admin', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Error fetching admin orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, token, navigate]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="dashboard-page fade-in container">
      <div className="dashboard-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert color="var(--accent-color)" /> Admin Dashboard
          </h1>
          <p>Store management and all orders overview</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="dashboard-content">
        <h2>All Store Orders</h2>
        
        <div className="glass" style={{ padding: '20px', borderRadius: '12px', marginTop: '20px', overflowX: 'auto' }}>
          {orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No orders have been placed yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer Account</th>
                  <th>Shipping Name</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td><strong>@{order.user_account_name}</strong></td>
                    <td>{order.customer_name}</td>
                    <td style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="status-badge" style={{ 
                          backgroundColor: order.status === 'Delivered' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: order.status === 'Delivered' ? 'var(--success-color)' : '#f59e0b'
                        }}>
                          {order.status}
                        </span>
                        {order.status === 'Pending' && (
                          <button 
                            onClick={() => updateOrderStatus(order.id, 'Delivered')}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
