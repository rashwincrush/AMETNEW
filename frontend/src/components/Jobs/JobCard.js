import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Paper, Button, Grid, Chip, Stack, Divider } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessIcon from '@mui/icons-material/Business';

const JobCard = ({ job }) => {
  return (
    <Paper 
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s, transform 0.3s',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          transform: 'translateY(-4px)'
        }
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box sx={{ 
          width: 50, 
          height: 50, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          borderRadius: 2, 
          bgcolor: 'grey.200' 
        }}>
          <BusinessIcon color="action" />
        </Box>
        <Box flexGrow={1}>
          <Typography 
            variant="h6" 
            component={Link} 
            to={`/jobs/${job.id}`} 
            sx={{ textDecoration: 'none', color: 'text.primary', fontWeight: '600' }}
          >
            {job.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {job.companies ? job.companies.name : 'N/A'}
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1} sx={{ mb: 2 }}>
        {job.location && (
          <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
            <LocationOnIcon fontSize="small" />
            <Typography variant="body2">{job.location}</Typography>
          </Stack>
        )}
        {job.job_type && (
          <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
            <WorkOutlineIcon fontSize="small" />
            <Typography variant="body2">{job.job_type}</Typography>
          </Stack>
        )}
        {job.salary_range && (
          <Stack direction="row" alignItems="center" spacing={1} color="text.secondary">
            <AttachMoneyIcon fontSize="small" />
            <Typography variant="body2">{job.salary_range}</Typography>
          </Stack>
        )}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
        {job.description?.slice(0, 120) + (job.description?.length > 120 ? '...' : '')}
      </Typography>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
        <Button component={Link} to={`/jobs/${job.id}`} variant="outlined" size="medium">View Details</Button>
        <Button component={Link} to={`/jobs/${job.id}/apply`} variant="contained" size="medium">Apply Now</Button>
      </Stack>
    </Paper>
  );
};

export default JobCard;
