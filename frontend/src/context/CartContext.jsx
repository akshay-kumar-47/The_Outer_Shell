import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isInitialLoad = useRef(true);

  // Fetch cart from backend if logged in, else use localStorage
  useEffect(() => {
    if (user && token) {
      const fetchCart = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
  if (res.ok) {
    const data = await res.json();
    // Data returns rows with `quantity` and product details
    setCart(data);
  }
} catch (err) {
  console.error('Failed to fetch cart', err);
}
      };
fetchCart();
    } else {
  const savedCart = localStorage.getItem('guest_cart');
  if (savedCart) setCart(JSON.parse(savedCart));
  else setCart([]);
}
  }, [user, token]);

// Sync cart changes to backend (debounced/on-change)
useEffect(() => {
  if (isInitialLoad.current) {
    isInitialLoad.current = false;
    return;
  }

  if (user && token) {
    // Sync to backend
    fetch(`${import.meta.env.VITE_API_URL}/api/cart/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cart })
    }).catch(err => console.error('Failed to sync cart', err));
  } else {
    // Save to local storage for guests
    localStorage.setItem('guest_cart', JSON.stringify(cart));
  }
}, [cart, user, token]);

const addToCart = (product) => {
  setCart((prevCart) => {
    const existingProduct = prevCart.find((item) => item.id === product.id);
    if (existingProduct) {
      return prevCart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    }
    return [...prevCart, { ...product, quantity: 1 }];
  });
  setIsCartOpen(true);
};

const removeFromCart = (productId) => {
  setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
};

const updateQuantity = (productId, delta) => {
  setCart((prevCart) =>
    prevCart.map((item) => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
      }
      return item;
    })
  );
};

const clearCart = () => setCart([]);

const toggleCart = () => setIsCartOpen(!isCartOpen);

const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

return (
  <CartContext.Provider
    value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      toggleCart,
      cartTotal,
      cartItemCount,
    }}
  >
    {children}
  </CartContext.Provider>
);
};
