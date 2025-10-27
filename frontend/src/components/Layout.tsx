import { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import Navbar from './Navigation/Navbar';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps): JSX.Element {
  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <main>{children}</main>
      </Container>
    </Box>
  );
}

export default Layout;