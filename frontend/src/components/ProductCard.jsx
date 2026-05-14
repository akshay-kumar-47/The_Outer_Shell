import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="product-card fade-in glass">
      <div className="product-image-container">
        <img src={product.image_url} alt={product.name} className="product-image" loading="lazy" />
        <div className="product-overlay">
          <button className="add-to-cart-btn btn btn-primary" onClick={() => addToCart(product)}>
            <ShoppingCart size={18} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">₹{Number(product.price).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
