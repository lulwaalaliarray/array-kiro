import React from 'react';
import Layout from '../components/Layout';

const BlogPage: React.FC = () => {
  const blogPosts = [
    {
      title: '5 Tips for Managing Your Health in Bahrain\'s Climate',
      excerpt: 'Learn how to stay healthy during Bahrain\'s hot summers and maintain your wellness year-round.',
      author: 'Dr. Fatima Al-Khalifa',
      date: '2024-03-10',
      category: 'Health Tips',
      readTime: '5 min read'
    },
    {
      title: 'Understanding Your Health Insurance Options in Bahrain',
      excerpt: 'A comprehensive guide to navigating health insurance plans and maximizing your healthcare benefits.',
      author: 'Ahmed Al-Mansouri',
      date: '2024-03-05',
      category: 'Insurance',
      readTime: '8 min read'
    },
    {
      title: 'The Future of Telemedicine in the Gulf Region',
      excerpt: 'Exploring how digital health technologies are transforming healthcare delivery across the GCC.',
      author: 'Dr. Sarah Johnson',
      date: '2024-02-28',
      category: 'Technology',
      readTime: '6 min read'
    }
  ];

  return (
    <Layout title="Blog" subtitle="Health insights and updates">
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
            Health & Wellness Blog
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Expert insights, health tips, and the latest updates from the world of healthcare in Bahrain.
          </p>
        </div>

        {/* Blog Posts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {blogPosts.map((post, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s',
              cursor: 'pointer'
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
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
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
                  {post.category}
                </span>
                <span style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {post.readTime}
                </span>
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px',
                lineHeight: '1.4'
              }}>
                {post.title}
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                lineHeight: '1.6',
                marginBottom: '16px'
              }}>
                {post.excerpt}
              </p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid #f3f4f6'
              }}>
                <div>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#111827',
                    margin: '0 0 4px 0'
                  }}>
                    {post.author}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Read More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default BlogPage;