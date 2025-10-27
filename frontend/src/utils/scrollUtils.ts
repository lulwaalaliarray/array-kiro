// Utility functions for scroll management

/**
 * Scrolls to the top of the page smoothly
 */
export const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

/**
 * Scrolls to a specific element by ID
 * @param elementId - The ID of the element to scroll to
 */
export const scrollToElement = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

/**
 * Scrolls to a specific position on the page
 * @param top - The vertical position to scroll to
 * @param left - The horizontal position to scroll to (optional)
 */
export const scrollToPosition = (top: number, left: number = 0): void => {
  window.scrollTo({
    top,
    left,
    behavior: 'smooth'
  });
};

/**
 * Gets the current scroll position
 * @returns Object with current scroll position
 */
export const getCurrentScrollPosition = (): { x: number; y: number } => {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  };
};

/**
 * Checks if the user has scrolled to the bottom of the page
 * @param threshold - The threshold in pixels from the bottom (default: 100)
 * @returns Boolean indicating if near bottom
 */
export const isNearBottom = (threshold: number = 100): boolean => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  return scrollTop + windowHeight >= documentHeight - threshold;
};