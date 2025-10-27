import React from 'react';
import Layout from '../components/Layout';

const PrivacyPage: React.FC = () => {
  return (
    <Layout title="Privacy Policy" subtitle="How we protect your data">
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
            Privacy Policy
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
              1. Information We Collect
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We collect information you provide directly to us, such as when you create an account, book appointments, 
              or contact us for support. This includes your name, email address, phone number, CPR number, and health information.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              2. How We Use Your Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We use the information we collect to provide, maintain, and improve our services, process appointments, 
              communicate with you, and ensure the security of our platform.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              3. Information Sharing
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
              except as described in this policy or as required by law.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              4. Data Security
            </h2>
            <p style={{ marginBottom: '16px' }}>
              We implement appropriate security measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. All data is encrypted using industry-standard encryption methods.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              5. Your Rights
            </h2>
            <p style={{ marginBottom: '16px' }}>
              You have the right to access, update, or delete your personal information. You may also opt out of certain 
              communications from us. Contact us to exercise these rights.
            </p>

            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginTop: '32px', marginBottom: '16px' }}>
              6. Contact Us
            </h2>
            <p style={{ marginBottom: '16px' }}>
              If you have any questions about this Privacy Policy, please contact us at privacy@patientcare.bh or 
              through our contact form.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPage;