import React from 'react';
import Layout from '../components/Layout';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Basic',
      price: 'Free',
      period: 'Forever',
      description: 'Perfect for individuals getting started with digital healthcare',
      features: [
        'Find and book appointments',
        'Basic health profile',
        'Appointment reminders',
        'Access to public health info',
        'Basic customer support'
      ],
      limitations: [
        'Limited to 2 appointments per month',
        'No priority booking',
        'Standard support only'
      ],
      buttonText: 'Get Started Free',
      popular: false,
      color: '#6b7280'
    },
    {
      name: 'Premium',
      price: '15 BHD',
      period: 'per month',
      description: 'Ideal for individuals and families who want comprehensive healthcare management',
      features: [
        'Unlimited appointments',
        'Priority booking',
        'Advanced health tracking',
        'Secure doctor messaging',
        'Prescription management',
        'Lab results integration',
        'Family account management',
        'Priority customer support',
        'Telehealth consultations'
      ],
      limitations: [],
      buttonText: 'Start Premium Trial',
      popular: true,
      color: '#0d9488'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Contact us',
      description: 'Tailored solutions for healthcare organizations and large employers',
      features: [
        'All Premium features',
        'Custom integrations',
        'Advanced analytics',
        'Dedicated account manager',
        'Custom branding',
        'API access',
        'Bulk user management',
        'Advanced security features',
        'SLA guarantees',
        '24/7 priority support'
      ],
      limitations: [],
      buttonText: 'Contact Sales',
      popular: false,
      color: '#7c3aed'
    }
  ];

  const faqs = [
    {
      question: 'Is there a free trial for Premium plans?',
      answer: 'Yes! We offer a 14-day free trial for our Premium plan. No credit card required to start your trial.'
    },
    {
      question: 'Can I change my plan anytime?',
      answer: 'Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing adjustments.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and bank transfers. All payments are processed securely through our encrypted payment system.'
    },
    {
      question: 'Is my health data secure?',
      answer: 'Yes, we use enterprise-grade encryption and are fully compliant with Bahrain\'s NHRA regulations. Your data is stored securely and never shared without your consent.'
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access to Premium features until the end of your current billing period.'
    }
  ];

  return (
    <Layout title="Pricing" subtitle="Choose your healthcare plan">
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
            Simple, Transparent Pricing
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Choose the perfect plan for your healthcare needs. All plans include access to Bahrain's top healthcare providers and our secure platform.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {plans.map((plan, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: plan.popular 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: plan.popular ? '2px solid #0d9488' : '1px solid #e5e7eb',
              position: 'relative',
              transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s'
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#0d9488',
                  color: 'white',
                  padding: '6px 24px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Most Popular
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  {plan.name}
                </h3>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color: plan.color
                  }}>
                    {plan.price}
                  </span>
                  {plan.period !== 'Contact us' && (
                    <span style={{
                      fontSize: '16px',
                      color: '#6b7280',
                      marginLeft: '8px'
                    }}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  lineHeight: '1.5'
                }}>
                  {plan.description}
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px'
                }}>
                  What's included:
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '12px'
                    }}>
                      Limitations:
                    </h4>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}>
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          <span style={{ color: '#ef4444', fontSize: '16px' }}>•</span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button style={{
                width: '100%',
                padding: '12px',
                backgroundColor: plan.popular ? plan.color : 'white',
                color: plan.popular ? 'white' : plan.color,
                border: `2px solid ${plan.color}`,
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!plan.popular) {
                  e.currentTarget.style.backgroundColor = plan.color;
                  e.currentTarget.style.color = 'white';
                }
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                if (!plan.popular) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = plan.color;
                }
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px 32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Frequently Asked Questions
          </h2>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{
                marginBottom: '32px',
                paddingBottom: '32px',
                borderBottom: index < faqs.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px'
                }}>
                  {faq.question}
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: '#6b7280',
                  lineHeight: '1.6'
                }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PricingPage;