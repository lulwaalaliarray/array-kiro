import React, { useEffect } from 'react';
import Header from './Header';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import StatsSection from './StatsSection';
import Footer from './Footer';
import BackToTopButton from './BackToTopButton';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  // Ensure page starts at top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleWatchDemo = () => {
    console.log('Watch demo clicked');
    // Implement demo logic
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      <Header />

      <HeroSection
        onGetStarted={onGetStarted}
        onWatchDemo={handleWatchDemo}
      />

      <FeaturesSection />

      <StatsSection />

      <Footer />
      
      {/* Back to Top Button */}
      <BackToTopButton />
    </div>
  );
};

export default WelcomeScreen;