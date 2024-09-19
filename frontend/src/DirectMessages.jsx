import {useState, useEffect, useCallback} from 'react';
import PropTypes from 'prop-types';
import {Container, Box, Typography, List, ListItem, ListItemText,
  TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, ListItemButton} from '@mui/material';
import {useUser} from './useUser';
import {useNavigate} from 'react-router-dom';

const DirectMessages = () => {
  const {user, setUser} = useUser();
  const [directMessages, setDirectMessages] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const fetchDirectMessages = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3010/v0/direct_messages_list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch direct messages');
      const data = await response.json();
      setDirectMessages(data);
    } catch (error) {
      console.error(error);
    }
  }, [user.token]);

  const fetchUserNames = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3010/v0/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user names');
      const data = await response.json();
      const userNamesMap = data.reduce((acc, user) => {
        acc[user.email] = user.username;
        return acc;
      }, {});
      setUserNames(userNamesMap);
    } catch (error) {
      console.error(error);
    }
  }, [user.token]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchDirectMessages();
      await fetchUserNames();
    };

    fetchData();
  }, [fetchDirectMessages, fetchUserNames]);

  const handleUserClick = async (otherUserEmail) => {
    setSelectedUser(otherUserEmail);
    const encodedEmail = encodeURIComponent(otherUserEmail);
    try {
      const response = await fetch(`http://localhost:3010/v0/direct_messages?otherUserEmail=${encodedEmail}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
      setOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    try {
      const response = await fetch(`http://localhost:3010/v0/direct_messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverEmail: selectedUser,
          content: newMessage,
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender_email: user.email,
          receiver_email: selectedUser,
          content: data.direct_message_data.content,
          created_at: data.direct_message_data.created_at,
        },
      ]);
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between"
        alignItems="center" width="100%" bgcolor="purple" p={1} mb={2}>
        <Typography variant="h6" color="white" sx={{fontSize: '1.35rem'}}>
          Direct Messages
        </Typography>
        <Button variant="contained" color="secondary"
          onClick={handleLogout} style={{height: '40px', width: '70px'}}>
          Logout
        </Button>
      </Box>
      <List>
        {directMessages.map((dm) => (
          <ListItem key={dm.other_user_email} onClick={() =>
            handleUserClick(dm.other_user_email)}>
            <ListItemButton>
              <ListItemText primary={userNames[dm.other_user_email] ||
                 dm.other_user_email} primaryTypographyProps=
                {{style: {fontSize: '0.85rem'}}} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Dialog open={open} onClose={() => setOpen(false)}
        maxWidth="sm" fullWidth>
        <DialogTitle>Chat with {userNames[selectedUser] ||
         selectedUser}</DialogTitle>
        <DialogContent style={{display: 'flex',
          flexDirection: 'column', height: '400px', paddingBottom: '0px'}}>
          <List style={{flexGrow: 1, overflowY: 'auto', marginBottom: '8px'}}>
            {messages.map((message, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${userNames[message.sender_email] ||
                     message.sender_email}: ${message.content}`}
                  secondary={new Date(message.created_at).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
          <TextField
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            variant="outlined"
            placeholder="Enter your message"
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">Close</Button>
          <Button onClick={handleSendMessage} color="primary">Send</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

DirectMessages.propTypes = {
  selectedWorkspace: PropTypes.shape({
    id: PropTypes.string,
  }),
};

export default DirectMessages;
