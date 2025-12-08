import React from 'react';
import { 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Users, 
  Calendar, 
  MessageSquare, 
  Briefcase,
  UserPlus,
  FolderOpen,
  Inbox
} from 'lucide-react';
import { Button } from './Buttons';

// ============================================
// SKELETON COMPONENTS
// ============================================

/**
 * Skeleton Card - for loading card-based lists (directory, groups, events)
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div 
      className={`card animate-pulse ${className}`}
      aria-hidden="true"
    >
      <div className="card-body">
        <div className="flex items-start gap-4">
          {/* Avatar skeleton */}
          <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
          
          <div className="flex-1 min-w-0 space-y-3">
            {/* Name skeleton */}
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            
            {/* Details skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
            </div>
            
            {/* Chips skeleton */}
            <div className="flex gap-2 flex-wrap">
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-6 bg-gray-200 rounded-full w-20" />
              <div className="h-6 bg-gray-200 rounded-full w-14" />
            </div>
          </div>
        </div>
        
        {/* Action buttons skeleton */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <div className="h-10 bg-gray-200 rounded-lg w-24" />
          <div className="h-10 bg-gray-200 rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Row - for loading table/list rows
 */
export function SkeletonRow({ columns = 4, className = '' }) {
  return (
    <div 
      className={`flex items-center gap-4 p-4 border-b border-gray-100 animate-pulse ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-200 rounded ${i === 0 ? 'w-1/4' : 'flex-1'}`} 
        />
      ))}
    </div>
  );
}

/**
 * Skeleton List - renders multiple skeleton items
 */
export function SkeletonList({ 
  count = 3, 
  variant = 'card', 
  columns = 4,
  className = '' 
}) {
  const SkeletonComponent = variant === 'row' ? SkeletonRow : SkeletonCard;
  
  return (
    <div 
      className={`space-y-4 ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} columns={columns} />
      ))}
    </div>
  );
}

/**
 * Skeleton Grid - for grid layouts
 */
export function SkeletonGrid({ 
  count = 6, 
  columns = 3,
  className = '' 
}) {
  return (
    <div 
      className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENTS
// ============================================

// Icon mapping for different content types
const emptyStateIcons = {
  default: Inbox,
  users: Users,
  search: Search,
  events: Calendar,
  messages: MessageSquare,
  jobs: Briefcase,
  connections: UserPlus,
  groups: Users,
  files: FolderOpen,
};

/**
 * Empty State - for when there's no data to display
 */
export function EmptyState({
  icon: CustomIcon,
  iconType = 'default',
  title = 'No items found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  actionVariant = 'primary',
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) {
  const IconComponent = CustomIcon || emptyStateIcons[iconType] || emptyStateIcons.default;

  return (
    <div className={`empty-state ${className}`} role="status">
      <IconComponent className="empty-state-icon" aria-hidden="true" />
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actionLabel && onAction && (
            <Button variant={actionVariant} onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function EmptySearchResults({ query, onClear, className = '' }) {
  return (
    <EmptyState
      iconType="search"
      title="No results found"
      description={query 
        ? `We couldn't find anything matching "${query}". Try adjusting your search or filters.`
        : "Try adjusting your search or filters to find what you're looking for."
      }
      actionLabel={query ? "Clear search" : undefined}
      onAction={onClear}
      className={className}
    />
  );
}

export function EmptyConnections({ onExplore, className = '' }) {
  return (
    <EmptyState
      iconType="connections"
      title="No connections yet"
      description="Start building your network by connecting with fellow alumni."
      actionLabel="Explore Directory"
      onAction={onExplore}
      className={className}
    />
  );
}

export function EmptyMessages({ onStartChat, className = '' }) {
  return (
    <EmptyState
      iconType="messages"
      title="No messages yet"
      description="Start a conversation with someone from your network."
      actionLabel="Start a Chat"
      onAction={onStartChat}
      className={className}
    />
  );
}

export function EmptyEvents({ onExplore, className = '' }) {
  return (
    <EmptyState
      iconType="events"
      title="No upcoming events"
      description="There are no events scheduled at this time. Check back later or explore past events."
      actionLabel="Explore Events"
      onAction={onExplore}
      className={className}
    />
  );
}

export function EmptyGroups({ onExplore, onCreate, className = '' }) {
  return (
    <EmptyState
      iconType="groups"
      title="No groups found"
      description="Join a group to connect with alumni who share your interests."
      actionLabel="Explore Groups"
      onAction={onExplore}
      secondaryActionLabel="Create Group"
      onSecondaryAction={onCreate}
      className={className}
    />
  );
}

// ============================================
// ERROR STATE COMPONENT
// ============================================

/**
 * Error State - for when something goes wrong
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this content. Please try again.',
  error,
  onRetry,
  retryLabel = 'Try Again',
  onGoBack,
  goBackLabel = 'Go Back',
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`} role="alert">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
      </div>
      <h3 className="empty-state-title text-red-900">{title}</h3>
      <p className="empty-state-description text-red-700">{description}</p>
      
      {error && process.env.NODE_ENV === 'development' && (
        <details className="mt-2 text-xs text-gray-500 max-w-sm">
          <summary className="cursor-pointer hover:text-gray-700">Technical details</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-left overflow-auto">
            {error.message || String(error)}
          </pre>
        </details>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        {onRetry && (
          <Button variant="primary" onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
            {retryLabel}
          </Button>
        )}
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack}>
            {goBackLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// PARTIAL/FILTERED STATE COMPONENT
// ============================================

/**
 * Partial Results Banner - shows when filters are applied
 */
export function PartialResultsBanner({
  count,
  totalCount,
  filterDescription,
  onClearFilters,
  className = '',
}) {
  if (!filterDescription && count === totalCount) return null;

  return (
    <div 
      className={`flex items-center justify-between gap-4 p-3 bg-ocean-50 border border-ocean-200 rounded-lg text-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="text-ocean-800">
        Showing <strong>{count}</strong>
        {totalCount && totalCount !== count && (
          <> of <strong>{totalCount}</strong></>
        )}
        {' '}results
        {filterDescription && (
          <span className="text-ocean-600"> • {filterDescription}</span>
        )}
      </p>
      
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-ocean-600 hover:text-ocean-800 font-medium hover:underline focus-ring rounded"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ============================================
// LOADING OVERLAY COMPONENT
// ============================================

/**
 * Loading Overlay - for showing loading state over existing content
 */
export function LoadingOverlay({ 
  message = 'Loading...', 
  className = '' 
}) {
  return (
    <div 
      className={`absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

// ============================================
// LIST CONTAINER WITH STATES
// ============================================

/**
 * ListContainer - wrapper that handles all list states
 * 
 * @param {object} props
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.error - Show error state
 * @param {Error} props.errorObject - Error object for details
 * @param {boolean} props.empty - Show empty state
 * @param {number} props.count - Number of items
 * @param {number} props.totalCount - Total items before filtering
 * @param {string} props.filterDescription - Description of active filters
 * @param {function} props.onRetry - Retry handler
 * @param {function} props.onClearFilters - Clear filters handler
 * @param {object} props.emptyStateProps - Props for EmptyState
 * @param {object} props.errorStateProps - Props for ErrorState
 * @param {number} props.skeletonCount - Number of skeleton items to show
 * @param {'card'|'row'} props.skeletonVariant - Skeleton variant
 * @param {React.ReactNode} props.children - Content to render when data is available
 */
export function ListContainer({
  loading = false,
  error = false,
  errorObject,
  empty = false,
  count = 0,
  totalCount,
  filterDescription,
  onRetry,
  onClearFilters,
  emptyStateProps = {},
  errorStateProps = {},
  skeletonCount = 3,
  skeletonVariant = 'card',
  className = '',
  children,
}) {
  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <SkeletonList count={skeletonCount} variant={skeletonVariant} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <ErrorState 
          error={errorObject} 
          onRetry={onRetry}
          {...errorStateProps}
        />
      </div>
    );
  }

  // Empty state
  if (empty || count === 0) {
    return (
      <div className={className}>
        <EmptyState {...emptyStateProps} />
      </div>
    );
  }

  // Content with optional partial results banner
  return (
    <div className={className}>
      {(filterDescription || (totalCount && totalCount !== count)) && (
        <PartialResultsBanner
          count={count}
          totalCount={totalCount}
          filterDescription={filterDescription}
          onClearFilters={onClearFilters}
          className="mb-4"
        />
      )}
      {children}
    </div>
  );
}

export default ListContainer;
