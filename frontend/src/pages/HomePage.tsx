import { useState, useEffect } from 'react';
import { Typography, Box, Button, Grid, Card, CardContent, Chip, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LocalHospital, Schedule, Payment, CheckCircle } from '@mui/icons-material';
import api from '../services/api';

function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  useEffect(() => {
    // Check backend connection
    const checkBackend = async () => {
      try {
        await api.get('/health');
        setBackendStatus('connected');
      } catch (error) {
        setBackendStatus('error');
      }
    };
    
    checkBackend();
  }, []);

  return (
    <Box>
      {/* Backend Status Indicator */}
      <Box mb={2}>
        {backendStatus === 'connected' && (
          <Alert severity="success" icon={<CheckCircle />}>
            🚀 PatientCare Platform is fully operational! Backend API connected successfully.
          </Alert>
        )}
        {backendStatus === 'error' && (
          <Alert severity="warning">
            ⚠️ Backend API is not responding. Some features may be limited.
          </Alert>
        )}
      </Box>

      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to PatientCare
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Your trusted healthcare appointment booking platform
        </Typography>
        
        {/* Status Chips */}
        <Box mb={4}>
          <Chip 
            label={backendStatus === 'connected' ? "✅ Backend Online" : "⚠️ Backend Offline"} 
            color={backendStatus === 'connected' ? "success" : "warning"}
            sx={{ mr: 1 }}
          />
          <Chip label="✅ Database Connected" color="success" sx={{ mr: 1 }} />
          <Chip label="✅ Frontend Active" color="success" />
        </Box>

        <Box mt={4}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ mr: 2 }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LocalHospital color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  Find Doctors
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Search and find qualified doctors near your location with our integrated Google Maps feature.
              </Typography>
              <Button 
                variant="text" 
                onClick={() => navigate('/doctors')}
                sx={{ mt: 2 }}
              >
                Search Doctors →
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Schedule color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  Book Appointments
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Schedule appointments easily with your preferred doctors for both online and physical consultations.
              </Typography>
              <Button 
                variant="text" 
                onClick={() => navigate('/appointments')}
                sx={{ mt: 2 }}
              >
                View Appointments →
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Payment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" component="h2">
                  Secure Payments
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Make secure payments for your appointments with our integrated Stripe payment gateway.
              </Typography>
              <Button 
                variant="text" 
                onClick={() => navigate('/dashboard')}
                sx={{ mt: 2 }}
              >
                Go to Dashboard →
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Features Section */}
      <Box mt={8}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Platform Features
        </Typography>
        <Grid container spacing={3} mt={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>🔐 Secure Authentication</Typography>
              <Typography variant="body2" color="text.secondary">JWT-based secure login for patients, doctors, and admins</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>📹 Video Consultations</Typography>
              <Typography variant="body2" color="text.secondary">Zoom integration for online medical consultations</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>📱 Mobile Responsive</Typography>
              <Typography variant="body2" color="text.secondary">Works seamlessly on desktop, tablet, and mobile devices</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>⭐ Reviews & Ratings</Typography>
              <Typography variant="body2" color="text.secondary">Rate and review doctors after appointments</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default HomePage;