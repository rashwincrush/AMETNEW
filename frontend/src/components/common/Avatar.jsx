import React, { useState, useEffect } from 'react';
import { getInitials, getCacheBustedUrl, getAvatarSizeClasses, getRoundedClass, getRoleBadgeColor } from '../../utils/ui';

/**
 * Universal Avatar Component
 * Handles user avatars and company logos with fallbacks, loading states, and badges
 * 
 * @param {object} props
 * @param {string} props.src - Image URL
 * @param {string} props.alt - Alt text (required for accessibility)
 * @param {number} props.size - Size in pixels: 24, 32, 40, 64, 96 (default: 40)
 * @param {string} props.rounded - Border radius: 'full', 'xl', 'md' (default: 'full')
 * @param {string} props.badge - Role badge: 'student', 'alumni', 'employer', 'mentor', 'admin', null
 * @param {boolean} props.square - If true, use square shape (for company logos)
 * @param {string} props.className - Additional CSS classes
 * @param {string|number} props.version - Cache-buster version
 */
const Avatar = ({ 
  src, 
  alt, 
  size = 40, 
  rounded = 'full', 
  badge = null, 
  square = false, 
  className = '',
  version = null,
  loading: loadingStrategy = 'lazy'
}) => {
  const [imageState, setImageState] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  const sizeClasses = getAvatarSizeClasses(size);
  const roundedClass = getRoundedClass(rounded, square);
  const initials = getInitials(alt);
  const imageUrl = version ? getCacheBustedUrl(src, version) : src;
  
  // Reset state when src changes
  useEffect(() => {
    if (src) {
      setImageState('loading');
      setHasAttemptedLoad(false);
    } else {
      setImageState('error');
    }
  }, [src]);
  
  const handleImageLoad = () => {
    setImageState('loaded');
    setHasAttemptedLoad(true);
  };
  
  const handleImageError = () => {
    // Only attempt fallback once to avoid infinite loops
    if (!hasAttemptedLoad) {
      setHasAttemptedLoad(true);
      setImageState('error');
    }
  };
  
  const containerClasses = `
    ${sizeClasses.container}
    ${roundedClass}
    relative
    inline-flex
    items-center
    justify-center
    overflow-hidden
    bg-slate-50
    ring-1
    ring-slate-200
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <div 
      className={containerClasses}
      role="img"
      aria-label={alt}
    >
      {/* Loading skeleton */}
      {imageState === 'loading' && src && (
        <div 
          className={`absolute inset-0 ${roundedClass} bg-slate-200 animate-pulse`}
          aria-hidden="true"
        />
      )}
      
      {/* Image */}
      {src && imageState !== 'error' && (
        <img
          src={imageUrl}
          alt={alt}
          loading={loadingStrategy}
          width={size}
          height={size}
          className={`
            ${sizeClasses.container}
            ${roundedClass}
            object-cover
            ${imageState === 'loading' ? 'opacity-0' : 'opacity-100'}
            transition-opacity
            duration-200
          `.trim().replace(/\s+/g, ' ')}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {/* Initials fallback */}
      {(!src || imageState === 'error' || imageState === 'loading') && (
        <div 
          className={`
            ${sizeClasses.container}
            ${roundedClass}
            flex
            items-center
            justify-center
            bg-gradient-to-br
            from-ocean-100
            to-ocean-200
            text-ocean-700
            font-semibold
            ${sizeClasses.text}
          `.trim().replace(/\s+/g, ' ')}
        >
          {initials}
        </div>
      )}
      
      {/* Role badge */}
      {badge && (
        <span 
          className={`
            absolute
            bottom-0
            right-0
            ${size >= 64 ? 'w-4 h-4' : 'w-3 h-3'}
            ${getRoleBadgeColor(badge)}
            rounded-full
            ring-2
            ring-white
          `.trim().replace(/\s+/g, ' ')}
          aria-label={`${badge} badge`}
          title={badge}
        />
      )}
    </div>
  );
};

export default Avatar;
