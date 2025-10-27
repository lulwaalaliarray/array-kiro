import React from 'react';
import Header from './Header';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import StatsSection from './StatsSection';
import Footer from './Footer';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {


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
    </div>
  );
};

export default WelcomeScreen;