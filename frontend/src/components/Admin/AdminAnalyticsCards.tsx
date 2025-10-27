import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip
} from '@mui/material';
import {
  People as PeopleIcon,
  Event as EventIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { SystemAnalytics } from '../../types/admin';

interface AdminAnalyticsCardsProps {
  analytics: SystemAnalytics;
}

export const AdminAnalyticsCards: React.FC<AdminAnalyticsCardsProps> = ({ analytics }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Grid container spacing={3}>
      {/* Users Overview */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {formatNumber(analytics.users.totalUsers)}
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  {analytics.users.newUsersThisMonth} new this month
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <PeopleIcon />
              </Avatar>
            </Box>
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Active: {analytics.users.activeUsers} | 
                Pending: {analytics.users.pendingVerifications}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Appointments Overview */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Appointments
                </Typography>
                <Typography variant="h4">
                  {formatNumber(analytics.appointments.totalAppointments)}
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  {analytics.appointments.appointmentsThisMonth} this month
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <EventIcon />
              </Avatar>
            </Box>
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Upcoming: {analytics.appointments.upcomingAppointments} | 
                Completed: {analytics.appointments.completedAppointments}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Revenue Overview */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(analytics.payments.totalRevenue)}
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  {formatCurrency(analytics.payments.revenueThisMonth)} this month
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <PaymentIcon />
              </Avatar>
            </Box>
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Avg: {formatCurrency(analytics.payments.averageTransactionValue)} | 
                Transactions: {analytics.payments.totalTransactions}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Ratings Overview */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="overline">
                  Average Rating
                </Typography>
                <Typography variant="h4">
                  {analytics.ratings.averageRating.toFixed(1)}
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  {formatNumber(analytics.ratings.totalReviews)} total reviews
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <StarIcon />
              </Avatar>
            </Box>
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Top doctors: {analytics.ratings.topRatedDoctors.length}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* User Role Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Distribution by Role
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
              {Object.entries(analytics.users.usersByRole).map(([role, count]) => (
                <Chip
                  key={role}
                  label={`${role}: ${count}`}
                  variant="outlined"
                  color={role === 'DOCTOR' ? 'primary' : role === 'PATIENT' ? 'success' : 'default'}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Appointment Status Distribution */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Appointment Status Distribution
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
              {Object.entries(analytics.appointments.appointmentsByStatus).map(([status, count]) => (
                <Chip
                  key={status}
                  label={`${status.replace('_', ' ')}: ${count}`}
                  variant="outlined"
                  color={
                    status === 'COMPLETED' ? 'success' :
                    status === 'CONFIRMED' ? 'primary' :
                    status === 'CANCELLED' ? 'error' : 'default'
                  }
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Monthly Revenue Trend */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monthly Revenue Trend
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
              {analytics.payments.monthlyRevenue.slice(-6).map((month) => (
                <Box key={`${month.month}-${month.year}`} textAlign="center">
                  <Typography variant="body2" color="textSecondary">
                    {month.month} {month.year}
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(month.revenue)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {month.transactionCount} transactions
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Rated Doctors */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Rated Doctors
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
              {analytics.ratings.topRatedDoctors.slice(0, 5).map((doctor) => (
                <Box key={doctor.id} p={2} border={1} borderColor="divider" borderRadius={1}>
                  <Typography variant="subtitle2">{doctor.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {doctor.specializations.join(', ')}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <StarIcon fontSize="small" color="warning" />
                    <Typography variant="body2" ml={0.5}>
                      {doctor.rating.toFixed(1)} ({doctor.totalReviews} reviews)
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};