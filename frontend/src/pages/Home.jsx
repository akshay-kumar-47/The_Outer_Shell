import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div className="spinner"></div>;
  if (error) return <div className="error-message glass">Error: {error}</div>;

  return (
    <div className="home-page fade-in">
      <section className="hero-section">
        <h1 className="hero-title">The Outer Shell</h1>
        <p className="hero-subtitle">Premium jackets designed for every element.</p>
      </section>

      <section className="products-section">
        <div className="section-header">
          <h2>New Arrivals</h2>
          <div className="header-line"></div>
        </div>
        
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
