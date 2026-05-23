import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Divider, Button, Alert, CircularProgress, Link } from '@mui/material';
import { Download, FileDownload } from '@mui/icons-material';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SecurityPasswordForm from '../../components/Profile/SecurityPasswordForm';
import SecurityQuestionForm from '../../components/Profile/SecurityQuestionForm';
import { toast } from 'react-hot-toast';

export default function Security() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please log in to view security settings.</div>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security Settings
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Change your password or set one if you signed up with OAuth only.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <SecurityPasswordForm
          user={user}
          providers={user?.app_metadata?.providers || []}
        />
      </Paper>

      {/* Security Question for account recovery */}
      <Box sx={{ mt: 3 }}>
        <SecurityQuestionForm />
      </Box>

      {/* GAP 3 FIX: GDPR Data Export */}
      <DataExportSection />

      {/* Future: Add 2FA toggle here */}
    </Box>
  );
}

// GAP 3 FIX: Data Export Component
function DataExportSection() {
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [recentExport, setRecentExport] = useState(null);

  // Check for existing export on mount
  useEffect(() => {
    checkRecentExport();
  }, []);

  const checkRecentExport = async () => {
    try {
      // Try to get any recent ready exports
      const { data, error } = await supabase
        .from('user_data_exports')
        .select('*')
        .eq('status', 'ready')
        .gt('expires_at', new Date().toISOString())
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setRecentExport(data);
      }
    } catch (e) {
      // No recent export found, that's fine
    }
  };

  const handleRequestExport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_my_data_export');

      if (error) throw error;

      if (data?.existing) {
        toast.info('A recent export is already available. You can request a new one after 24 hours.');
        setRecentExport(data);
      } else if (data?.success) {
        toast.success(data.message || 'Your data export is ready!');
        setExportData(data);
        setRecentExport(data);
      } else {
        toast.error(data?.error || 'Failed to create export');
      }
    } catch (err) {
      toast.error('Failed to export data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const exportId = exportData?.export_id || recentExport?.id;
    if (!exportId) return;

    try {
      const { data, error } = await supabase.rpc('get_my_export_download_url', {
        p_export_id: exportId
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        // Create JSON blob and download
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alumni-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Download started!');
      } else {
        toast.error(data?.error || 'Export not available');
      }
    } catch (err) {
      toast.error('Failed to download: ' + err.message);
    }
  };

  const activeExport = exportData || recentExport;
  const canRequestNew = !recentExport || (
    new Date(recentExport.requested_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        <FileDownload sx={{ mr: 1, verticalAlign: 'middle' }} />
        Export My Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Download a copy of all your personal data stored on the platform. 
        This includes your profile, job applications, connections, event registrations, and more.
        This export is for your records and to comply with GDPR data portability requirements.
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {activeExport?.status === 'ready' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Your data export is ready!
            {activeExport?.file_size_bytes && (
              <span> (Size: {(activeExport.file_size_bytes / 1024).toFixed(1)} KB)</span>
            )}
          </Typography>
          {activeExport?.expires_at && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              This link expires on: {new Date(activeExport.expires_at).toLocaleDateString()}
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<Download />}
            onClick={handleDownload}
            sx={{ mt: 1 }}
          >
            Download JSON
          </Button>
        </Alert>
      )}

      {recentExport && !canRequestNew && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            You requested an export on {new Date(recentExport.requested_at).toLocaleDateString()}.
            You can request a new export after 24 hours.
          </Typography>
        </Alert>
      )}

      <Button
        variant="outlined"
        onClick={handleRequestExport}
        disabled={loading || (recentExport && !canRequestNew)}
        startIcon={loading ? <CircularProgress size={16} /> : <FileDownload />}
      >
        {loading ? 'Creating Export...' : (activeExport?.status === 'ready' ? 'Generate New Export' : 'Request Data Export')}
      </Button>

      <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
        Note: For security and performance reasons, you can only request one data export every 24 hours.
        The export includes all data associated with your account and will be available for download for 7 days.
      </Typography>
    </Paper>
  );
}
