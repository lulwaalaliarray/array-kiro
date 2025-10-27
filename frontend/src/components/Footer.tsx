import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'Find Doctors', href: '#doctors' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Security', href: '#security' }
    ],
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'Careers', href: '#careers' },
      { name: 'Press', href: '#press' },
      { name: 'Blog', href: '#blog' }
    ],
    support: [
      { name: 'Help Center', href: '#help' },
      { name: 'Contact Us', href: '#contact' },
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms of Service', href: '#terms' }
    ]
  };

  return (
    <footer style={{
      backgroundColor: '#111827',
      color: 'white',
      padding: '80px 20px 40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth >= 1024 ? '2fr 1fr 1fr 1fr' : window.innerWidth >= 768 ? '1fr 1fr' : '1fr',
          gap: '40px',
          marginBottom: '60px'
        }}>
          {/* Brand Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#0d9488',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4h4v4zm0-6h-4V7h4v4z"/>
                </svg>
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0
              }}>
                Patient<span style={{ color: '#0d9488' }}>Care</span>
              </h3>
            </div>
            <p style={{
              fontSize: '16px',
              color: '#9ca3af',
              lineHeight: '1.6',
              marginBottom: '24px',
              maxWidth: '300px'
            }}>
              Bahrain's trusted healthcare platform. Connect with licensed professionals, manage appointments, and take control of your health journey across the Kingdom.
            </p>
            
            {/* Social Links */}
            <div style={{ display: 'flex', gap: '16px' }}>
              {['twitter', 'facebook', 'linkedin', 'instagram'].map((social) => (
                <a
                  key={social}
                  href={`#${social}`}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#374151',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d9488';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '20px',
              color: 'white'
            }}>
              Product
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {footerLinks.product.map((link) => (
                <li key={link.name} style={{ marginBottom: '12px' }}>
                  <a
                    href={link.href}
                    style={{
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '14px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#0d9488';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '20px',
              color: 'white'
            }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {footerLinks.company.map((link) => (
                <li key={link.name} style={{ marginBottom: '12px' }}>
                  <a
                    href={link.href}
                    style={{
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '14px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#0d9488';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '20px',
              color: 'white'
            }}>
              Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {footerLinks.support.map((link) => (
                <li key={link.name} style={{ marginBottom: '12px' }}>
                  <a
                    href={link.href}
                    style={{
                      color: '#9ca3af',
                      textDecoration: 'none',
                      fontSize: '14px',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#0d9488';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '8px',
            color: 'white'
          }}>
            Stay updated with PatientCare
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
            marginBottom: '24px'
          }}>
            Get the latest health tips for Bahrain's climate, product updates, and exclusive offers for Kingdom residents.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: window.innerWidth >= 640 ? 'row' : 'column',
            gap: '12px',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #374151',
                backgroundColor: '#111827',
                color: 'white',
                fontSize: '14px'
              }}
            />
            <button
              style={{
                padding: '12px 24px',
                backgroundColor: '#0d9488',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0f766e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0d9488';
              }}
            >
              Subscribe
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #374151',
          paddingTop: '32px',
          display: 'flex',
          flexDirection: window.innerWidth >= 768 ? 'row' : 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            margin: 0
          }}>
            © {currentYear} PatientCare. All rights reserved.
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" fill="#10b981" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              NHRA Approved
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" fill="#10b981" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              MOH Certified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;