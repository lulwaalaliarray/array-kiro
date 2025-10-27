import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { saveBlogPost, generateBlogId, BlogPost } from '../utils/blogStorage';
import { useToast } from '../components/Toast';
import { isLoggedIn } from '../utils/navigation';

const CreateBlogPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Health Tips',
    tags: '',
    published: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is a doctor
    if (!isLoggedIn()) {
      showToast('Please log in to create a blog post', 'error');
      navigate('/login');
      return;
    }

    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.userType !== 'doctor') {
          showToast('Only doctors can create blog posts', 'error');
          navigate('/blog');
          return;
        }
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    }
  }, [navigate, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const calculateReadTime = (content: string): string => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showToast('User not found', 'error');
      return;
    }

    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const blogPost: BlogPost = {
        id: generateBlogId(),
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        author: user.name,
        authorId: user.id || user.email,
        date: new Date().toISOString().split('T')[0],
        category: formData.category,
        readTime: calculateReadTime(formData.content),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        published: formData.published
      };

      saveBlogPost(blogPost);
      showToast(
        formData.published ? 'Blog post published successfully!' : 'Blog post saved as draft!',
        'success'
      );
      navigate('/blog');
    } catch (error) {
      console.error('Error saving blog post:', error);
      showToast('Error saving blog post. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Please add a title and content to preview', 'error');
      return;
    }
    
    // Store preview data temporarily
    const previewData = {
      ...formData,
      author: user?.name || 'Preview Author',
      date: new Date().toISOString().split('T')[0],
      readTime: calculateReadTime(formData.content)
    };
    
    localStorage.setItem('blog_preview', JSON.stringify(previewData));
    window.open('/blog/preview', '_blank');
  };

  if (!user) {
    return (
      <Layout>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            color: '#6b7280'
          }}>
            Loading...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Create Blog Post" subtitle="Share your medical expertise">
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
          }}>
            Create New Blog Post
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0
          }}>
            Share your medical knowledge and insights with patients and colleagues
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter an engaging title for your blog post"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
            </div>

            {/* Category and Tags Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Health Tips">Health Tips</option>
                  <option value="Medical Research">Medical Research</option>
                  <option value="Disease Prevention">Disease Prevention</option>
                  <option value="Treatment Options">Treatment Options</option>
                  <option value="Mental Health">Mental Health</option>
                  <option value="Nutrition">Nutrition</option>
                  <option value="Exercise & Fitness">Exercise & Fitness</option>
                  <option value="Technology">Technology</option>
                  <option value="Insurance">Insurance</option>
                  <option value="General Health">General Health</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="health, wellness, tips"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Excerpt */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Excerpt *
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                placeholder="Write a brief summary that will appear on the blog listing page"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
            </div>

            {/* Content */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Content *
              </label>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                Use markdown formatting: # for headings, ## for subheadings, **text** for bold, - for bullet points
              </div>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Write your blog content here using markdown formatting..."
                rows={20}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical',
                  fontFamily: 'monospace',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
            </div>

            {/* Publish Option */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="published"
                  checked={formData.published}
                  onChange={handleInputChange}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#0d9488'
                  }}
                />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827'
                }}>
                  Publish immediately (uncheck to save as draft)
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => navigate('/blog')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePreview}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#0d9488',
                  border: '1px solid #0d9488',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdfa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Preview
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isSubmitting ? '#9ca3af' : '#0d9488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#0f766e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#0d9488';
                  }
                }}
              >
                {isSubmitting ? 'Saving...' : (formData.published ? 'Publish Post' : 'Save Draft')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateBlogPage;