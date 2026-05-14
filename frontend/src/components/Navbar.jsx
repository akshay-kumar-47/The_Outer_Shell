import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Shirt, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { cartItemCount, toggleCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUserClick = () => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="navbar glass">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <Shirt className="logo-icon" />
          <span>The Outer Shell</span>
        </Link>
        
        <div className="navbar-actions">
          <button className="user-btn" onClick={handleUserClick} title={user ? "Dashboard" : "Login"}>
            <User size={20} />
          </button>
          <button className="cart-btn" onClick={toggleCart}>
            <ShoppingBag />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
