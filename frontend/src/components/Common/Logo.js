import React, { useState } from 'react';

const Logo = ({ className = 'h-10 w-auto', alt = 'Logo' }) => {
  const [imgError, setImgError] = useState(false);

  // Simple base64 fallback logo (a blue square with "A" in it)
  // Replace with your own base64 encoded minimal logo if needed
  const fallbackLogoBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0IiBmaWxsPSJub25lIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiMzMzMzZmYiPjwvcmVjdD48dGV4dCB4PSIyMCIgeT0iNDIiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPkE8L3RleHQ+PC9zdmc+";

  const handleImageError = () => {
    console.error('Logo image failed to load');
    setImgError(true);
  };

  // Try multiple paths in case one works
  const logoSources = [
    '/Logo.png', 
    '/static/Logo.png',
    '/logo.png',
    process.env.PUBLIC_URL + '/Logo.png',
    'Logo.png'
  ];
  
  if (imgError) {
    return <img src={fallbackLogoBase64} alt={alt} className={className} />;
  }

  return (
    <picture>
      {/* Fallback for browsers that don't support picture */}
      <source srcSet={logoSources[0]} />
      <img
        src={logoSources[0]}
        alt={alt}
        className={className}
        onError={handleImageError}
      />
    </picture>
  );
};

export default Logo;
