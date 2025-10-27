import React from 'react';
import Layout from '../components/Layout';

const CareersPage: React.FC = () => {
  const openPositions = [
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Manama, Bahrain',
      type: 'Full-time',
      description: 'Join our team to build the future of healthcare technology in Bahrain.'
    },
    {
      title: 'Healthcare Product Manager',
      department: 'Product',
      location: 'Manama, Bahrain',
      type: 'Full-time',
      description: 'Lead product development for our healthcare platform serving the Kingdom.'
    },
    {
      title: 'Medical Affairs Specialist',
      department: 'Medical',
      location: 'Manama, Bahrain',
      type: 'Full-time',
      description: 'Ensure clinical accuracy and regulatory compliance for our platform.'
    }
  ];

  return (
    <Layout title="Careers" subtitle="Join our mission">
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
            Join Our Team
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Help us revolutionize healthcare in Bahrain. We're looking for passionate individuals who want to make a difference in people's lives through technology.
          </p>
        </div>

        {/* Open Positions */}
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
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            Open Positions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {openPositions.map((position, index) => (
              <div key={index} style={{
                padding: '24px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px'
                  }}>
                    {position.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    <span>{position.department}</span>
                    <span>•</span>
                    <span>{position.location}</span>
                    <span>•</span>
                    <span>{position.type}</span>
                  </div>
                  <p style={{
                    fontSize: '16px',
                    color: '#6b7280'
                  }}>
                    {position.description}
                  </p>
                </div>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}>
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CareersPage;