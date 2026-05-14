import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';

export function useBranding() {
  const { branding } = useAuth();

  useEffect(() => {
    if (branding?.brand_primary_color || branding?.brand_secondary_color) {
      const root = document.documentElement;
      
      // Convert hex to HSL for CSS variables
      if (branding.brand_primary_color) {
        const hslPrimary = hexToHSL(branding.brand_primary_color);
        root.style.setProperty('--hub-primary', hslPrimary);
      }
      
      if (branding.brand_secondary_color) {
        const hslSecondary = hexToHSL(branding.brand_secondary_color);
        root.style.setProperty('--hub-secondary', hslSecondary);
      }
    }
  }, [branding]);

  return branding;
}

function hexToHSL(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  // Return as HSL string (0-360, 0-100, 0-100)
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}