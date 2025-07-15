import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Avatar } from '@mui/material';

const MentorshipChat = () => {
  const { requestId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestDetails, setRequestDetails] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRequestDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mentorship_requests')
        .select('*, mentor:mentor_id(full_name, avatar_url), mentee:mentee_id(full_name, avatar_url)')
        .eq('id', requestId)
        .eq('status', 'accepted')
        .single();
      if (error) throw new Error('Failed to verify mentorship status or access denied.');
      setRequestDetails(data);
    } catch (error) {
      toast.error(error.message);
      setRequestDetails(null); // Deny access
    }
  }, [requestId]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mentorship_messages')
        .select('*, sender:sender_id(full_name, avatar_url)')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      toast.error('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequestDetails().then(() => {
        fetchMessages();
    });
  }, [fetchRequestDetails, fetchMessages]);

  useEffect(() => {
    const subscription = supabase
      .channel(`mentorship-chat-${requestId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mentorship_messages', filter: `request_id=eq.${requestId}` }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !requestDetails) return;

    const receiverId = user.id === requestDetails.mentor_id ? requestDetails.mentee_id : requestDetails.mentor_id;

    const message = {
      request_id: requestId,
      sender_id: user.id,
      receiver_id: receiverId,
      message_content: newMessage.trim(),
    };

    const { error } = await supabase.from('mentorship_messages').insert(message);

    if (error) {
      toast.error('Failed to send message: ' + error.message);
    } else {
      setNewMessage('');
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  if (!requestDetails) return <Typography sx={{ textAlign: 'center', mt: 4 }}>This chat is not available.</Typography>;

  const otherParty = user.id === requestDetails.mentor.id ? requestDetails.mentee : requestDetails.mentor;

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6">Chat with {otherParty.full_name}</Typography>
        </Box>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, backgroundColor: '#fafafa' }}>
          {messages.map((msg) => (
            <Box key={msg.id} sx={{ mb: 2, display: 'flex', justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexDirection: msg.sender_id === user.id ? 'row-reverse' : 'row' }}>
                <Avatar src={msg.sender.avatar_url} />
                <Paper sx={{ p: 1.5, borderRadius: '10px', backgroundColor: msg.sender_id === user.id ? '#1976d2' : '#e0e0e0', color: msg.sender_id === user.id ? 'white' : 'black' }}>
                  <Typography variant="body1">{msg.message_content}</Typography>
                </Paper>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit" variant="contained" disabled={!newMessage.trim()}>Send</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default MentorshipChat;
