import React from 'react';
import Layout from '../components/Layout';

const PressPage: React.FC = () => {
  const pressReleases = [
    {
      date: '2024-03-15',
      title: 'PatientCare Launches Revolutionary Healthcare Platform in Bahrain',
      excerpt: 'New digital platform connects patients with healthcare providers across the Kingdom, improving access to quality medical care.',
      category: 'Product Launch'
    },
    {
      date: '2024-02-28',
      title: 'PatientCare Receives NHRA Certification for Healthcare Data Management',
      excerpt: 'Platform achieves full compliance with Bahrain\'s National Health Regulatory Authority standards for patient data protection.',
      category: 'Regulatory'
    },
    {
      date: '2024-01-20',
      title: 'PatientCare Partners with Leading Hospitals Across Bahrain',
      excerpt: 'Strategic partnerships with major healthcare institutions expand platform reach to serve more patients nationwide.',
      category: 'Partnership'
    }
  ];

  return (
    <Layout title="Press" subtitle="Latest news and updates">
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
            Press & Media
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Stay updated with the latest news, announcements, and developments from PatientCare.
          </p>
        </div>

        {/* Press Releases */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '32px'
          }}>
            Recent Press Releases
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {pressReleases.map((release, index) => (
              <div key={index} style={{
                paddingBottom: '32px',
                borderBottom: index < pressReleases.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: '#f0fdfa',
                    color: '#0d9488',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {release.category}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    {new Date(release.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '12px'
                }}>
                  {release.title}
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}>
                  {release.excerpt}
                </p>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#0d9488',
                  border: '1px solid #0d9488',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Read Full Release
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PressPage;