import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customer_name: '',
    address: '',
    email: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (cart.length === 0 && !success) {
    return (
      <div className="checkout-empty fade-in">
        <h2>Your cart is empty</h2>
        <p>You need items in your cart to checkout.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Browse Products
        </button>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const orderData = {
      customer_name: formData.customer_name,
      address: formData.address,
      payment_method: paymentMethod,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      setSuccess(true);
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="checkout-success fade-in glass">
        <CheckCircle size={64} className="success-icon" />
        <h2>Order Confirmed!</h2>
        <p>Your order has been placed successfully. You will pay on delivery.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page fade-in">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Complete your order</p>
      </div>

      <div className="checkout-content">
        <form className="checkout-form glass" onSubmit={handleSubmit}>
          <h3>Shipping Details</h3>
          
          <div className="form-row">
            <div className="input-group full-width">
              <label htmlFor="customer_name">Full Name</label>
              <input 
                type="text" 
                id="customer_name" 
                name="customer_name" 
                className="input-field" 
                required 
                value={formData.customer_name}
                onChange={handleInputChange}
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group half-width">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                className="input-field" 
                required 
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
              />
            </div>
            <div className="input-group half-width">
              <label htmlFor="phone">Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                className="input-field" 
                required 
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group full-width">
              <label htmlFor="address">Shipping Address</label>
              <textarea 
                id="address" 
                name="address" 
                className="input-field" 
                rows="3" 
                required
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main St, City, Country, ZIP"
              ></textarea>
            </div>
          </div>

          <h3 className="payment-heading">Payment Method</h3>
          
          <div className="payment-methods">
            <label className={`payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="payment" 
                value="COD" 
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
              />
              <div className="payment-content">
                <Banknote className="payment-icon" />
                <span>Cash on Delivery</span>
              </div>
            </label>

            <label className="payment-option disabled" title="Currently unavailable">
              <input type="radio" name="payment" value="CARD" disabled />
              <div className="payment-content">
                <CreditCard className="payment-icon" />
                <span>Credit/Debit Card</span>
              </div>
              <span className="badge">Coming Soon</span>
            </label>

            <label className="payment-option disabled" title="Currently unavailable">
              <input type="radio" name="payment" value="UPI" disabled />
              <div className="payment-content">
                <Smartphone className="payment-icon" />
                <span>UPI Payment</span>
              </div>
              <span className="badge">Coming Soon</span>
            </label>
          </div>

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary submit-btn" 
            disabled={loading}
          >
            {loading ? 'Processing...' : `Place Order • ₹${cartTotal.toFixed(2)}`}
          </button>
        </form>

        <div className="order-summary glass">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {cart.map(item => (
              <div key={item.id} className="summary-item">
                <img src={item.image_url} alt={item.name} />
                <div className="summary-item-info">
                  <span className="name">{item.name}</span>
                  <span className="qty">Qty: {item.quantity}</span>
                </div>
                <span className="price">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="summary-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="total-row final">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
