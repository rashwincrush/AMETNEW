import React from 'react';
import { useRealtime } from '../../utils/supabase';
import { Tooltip } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

/**
 * Component that displays a network status indicator when the app is running in fallback mode
 */
const NetworkStatusIndicator = () => {
  const { isRealtimeReady } = useRealtime();

  // Only show indicator when not in realtime mode
  if (isRealtimeReady) {
    return null;
  }

  return (
    <Tooltip title="Operating in offline mode. Real-time updates disabled. Changes may require manual refresh.">
      <div className="fixed bottom-4 right-4 z-50 bg-amber-50 text-amber-800 px-3 py-1 rounded-full 
                      shadow-md border border-amber-300 flex items-center space-x-1 cursor-help">
        <WifiOffIcon fontSize="small" />
        <span className="text-xs font-medium">Offline Mode</span>
      </div>
    </Tooltip>
  );
};

export default NetworkStatusIndicator;
