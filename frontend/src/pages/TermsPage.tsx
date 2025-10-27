import React from 'react';
import Layout from '../components/Layout';

const TermsPage: React.FC = () => {
  return (
    <Layout title="Terms of Service" subtitle="Terms and conditions">
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Terms of Service
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '32px'
          }}>
            Last updated: March 2024
          </p>

          <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#374151' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              1. Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '16px' }}>
              By accessing and using PatientCare, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              2. Use License
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Permission is granted to temporarily use PatientCare for personal, non-commercial transitory viewing only. 
              This is the grant of a license, not a transfer of title.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              3. Medical Disclaimer
            </h2>
            <p style={{ marginBottom: '16px' }}>
              PatientCare is a platform that connects patients with healthcare providers. We do not provide medical advice, 
              diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              4. User Accounts
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept 
              responsibility for all activities that occur under your account.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              5. Prohibited Uses
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts. 
              You may not violate any international, federal, provincial, or state regulations, rules, or laws.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              6. Limitation of Liability
            </h2>
            <p style={{ marginBottom: '16px' }}>
              In no event shall PatientCare or its suppliers be liable for any damages arising out of the use or 
              inability to use the materials on PatientCare's platform.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              7. Contact Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about these Terms of Service, please contact us at legal@patientcare.bh.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsPage;