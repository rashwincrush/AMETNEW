import React from 'react';

const Logo = ({ className = 'h-10 w-auto', alt = 'Logo' }) => {
  // Logo is actually a JPEG despite .png extension
  // We'll use it directly without the error fallback that was showing
  
  return (
    <div className={className} style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <img
        src="/logo.png"
        alt={alt}
        style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}}
      />
    </div>
  );
};

export default Logo;
