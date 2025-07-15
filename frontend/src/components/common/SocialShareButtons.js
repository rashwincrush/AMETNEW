import React from 'react';
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
} from 'react-share';
import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';

const SocialShareButtons = ({ shareUrl, title }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Share this page:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <FacebookShareButton url={shareUrl} quote={title}>
          <FacebookIcon size={32} round />
        </FacebookShareButton>

        <TwitterShareButton url={shareUrl} title={title}>
          <TwitterIcon size={32} round />
        </TwitterShareButton>

        <LinkedinShareButton url={shareUrl} title={title}>
          <LinkedinIcon size={32} round />
        </LinkedinShareButton>

        <WhatsappShareButton url={shareUrl} title={title} separator=":: ">
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>

        <Tooltip title="Instagram sharing is not supported directly from web. Please copy the link and share it manually.">
          <span>
            <IconButton disabled>
              <InstagramIcon sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                color: 'white', 
                background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                padding: '2px'
              }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default SocialShareButtons;
