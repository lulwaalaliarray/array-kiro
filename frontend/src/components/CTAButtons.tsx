import React from 'react';

interface CTAButtonsProps {
  onGetStarted: () => void;
  onLearnMore?: () => void;
  alignment?: 'center' | 'left' | 'right';
  className?: string;
}

const CTAButtons: React.FC<CTAButtonsProps> = ({ 
  onGetStarted, 
  onLearnMore, 
  alignment = 'center',
  className = '' 
}) => {
  const alignmentClasses = {
    center: 'justify-center',
    left: 'justify-start',
    right: 'justify-end'
  };

  const handleLearnMore = () => {
    if (onLearnMore) {
      onLearnMore();
    } else {
      // Default behavior - scroll to features or show modal
      console.log('Learn more clicked');
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 items-center sm:items-start ${alignmentClasses[alignment]} lg:${alignmentClasses[alignment]} ${className}`}>
      {/* Primary CTA Button */}
      <button 
        onClick={onGetStarted}
        className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-500 rounded-lg shadow-md hover:shadow-lg hover:from-teal-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition-all duration-200 active:transform-none whitespace-nowrap"
        aria-label="Get started with PatientCare"
      >
        <span className="flex-shrink-0">Get Started</span>
        <svg 
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 7l5 5m0 0l-5 5m5-5H6" 
          />
        </svg>
        
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </button>
      
      {/* Secondary CTA Button */}
      <button 
        onClick={handleLearnMore}
        className="group inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 border border-gray-200 hover:border-gray-300 whitespace-nowrap"
        aria-label="Learn more about PatientCare"
      >
        <svg 
          className="w-4 h-4 flex-shrink-0 transition-colors duration-200 group-hover:text-teal-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <span className="flex-shrink-0">Learn More</span>
      </button>
    </div>
  );
};

export default CTAButtons;