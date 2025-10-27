import React from 'react';
import Layout from '../components/Layout';

const SecurityPage: React.FC = () => {
  const securityFeatures = [
    {
      icon: '🔒',
      title: 'End-to-End Encryption',
      description: 'All your health data is encrypted using AES-256 encryption, both in transit and at rest. Your information is protected with the same level of security used by banks.',
      details: ['AES-256 encryption standard', 'TLS 1.3 for data transmission', 'Encrypted database storage', 'Secure key management']
    },
    {
      icon: '🛡️',
      title: 'NHRA Compliance',
      description: 'Fully compliant with Bahrain\'s National Health Regulatory Authority standards and international healthcare data protection regulations.',
      details: ['NHRA certified platform', 'Regular compliance audits', 'Healthcare data standards', 'Patient privacy protection']
    },
    {
      icon: '🔐',
      title: 'Multi-Factor Authentication',
      description: 'Secure your account with multiple layers of authentication including SMS, email verification, and biometric options.',
      details: ['SMS verification', 'Email authentication', 'Biometric login support', 'Device registration']
    },
    {
      icon: '👥',
      title: 'Access Controls',
      description: 'Granular permission system ensures only authorized healthcare providers can access your medical information with your explicit consent.',
      details: ['Role-based access control', 'Patient consent management', 'Audit trail logging', 'Time-limited access']
    },
    {
      icon: '🔍',
      title: 'Regular Security Audits',
      description: 'Our platform undergoes regular security assessments by third-party security firms to identify and address potential vulnerabilities.',
      details: ['Quarterly security audits', 'Penetration testing', 'Vulnerability assessments', 'Security monitoring']
    },
    {
      icon: '💾',
      title: 'Secure Data Backup',
      description: 'Your data is automatically backed up to multiple secure locations with point-in-time recovery capabilities.',
      details: ['Automated daily backups', 'Geographic redundancy', 'Point-in-time recovery', 'Disaster recovery planning']
    }
  ];

  const certifications = [
    {
      name: 'NHRA Certified',
      description: 'Certified by Bahrain\'s National Health Regulatory Authority',
      icon: '🇧🇭'
    },
    {
      name: 'ISO 27001',
      description: 'International standard for information security management',
      icon: '🏆'
    },
    {
      name: 'SOC 2 Type II',
      description: 'Service Organization Control 2 compliance for security and availability',
      icon: '✅'
    },
    {
      name: 'GDPR Compliant',
      description: 'General Data Protection Regulation compliance for EU residents',
      icon: '🇪🇺'
    }
  ];

  return (
    <Layout title="Security" subtitle="Your data protection is our priority">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Hero Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px 32px',
          marginBottom: '32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Enterprise-Grade Security
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '800px',
            margin: '0 auto 32px',
            lineHeight: '1.6'
          }}>
            Your health data deserves the highest level of protection. We implement industry-leading security measures to keep your personal health information safe and secure.
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#f0fdf4',
            borderRadius: '50px',
            border: '1px solid #16a34a'
          }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <span style={{ color: '#16a34a', fontWeight: '600' }}>
              Bank-level security for your health data
            </span>
          </div>
        </div>

        {/* Security Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {securityFeatures.map((feature, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>
                {feature.description}
              </p>
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#0d9488',
                  marginBottom: '12px'
                }}>
                  Key Features:
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px 32px',
          marginBottom: '48px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Security Certifications & Compliance
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px'
          }}>
            {certifications.map((cert, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '24px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0d9488';
                e.currentTarget.style.backgroundColor = '#f0fdfa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>
                  {cert.icon}
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '12px'
                }}>
                  {cert.name}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.5'
                }}>
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Security Commitment */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px 32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '24px'
            }}>
              Our Security Commitment
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#6b7280',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              We understand that your health information is among your most sensitive personal data. That's why we've built our platform with security as the foundation, not an afterthought. Every feature, every integration, and every update is designed with your privacy and security in mind.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px',
              marginBottom: '32px'
            }}>
              <div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#0d9488',
                  marginBottom: '8px'
                }}>
                  99.9%
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Uptime Guarantee
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#0d9488',
                  marginBottom: '8px'
                }}>
                  24/7
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Security Monitoring
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#0d9488',
                  marginBottom: '8px'
                }}>
                  Zero
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Data Breaches
                </div>
              </div>
            </div>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Have questions about our security practices? Our security team is available to discuss our measures and provide additional documentation for enterprise customers.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SecurityPage;