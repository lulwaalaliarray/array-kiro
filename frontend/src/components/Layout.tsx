import React from 'react';
import { Link } from 'react-router-dom';
import Footer from './Footer';
import { routes } from '../utils/navigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '20px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to={routes.home} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#0d9488',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4h4v4zm0-6h-4V7h4v4z"/>
                </svg>
              </div>
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  margin: 0
                }}>
                  PatientCare
                </h1>
                {(title || subtitle) && (
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {subtitle || title}
                  </p>
                )}
              </div>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              to={routes.login}
              style={{
                padding: '8px 16px',
                color: '#0d9488',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdfa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Sign In
            </Link>
            <Link
              to={routes.signup}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0d9488',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f766e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0d9488';
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;