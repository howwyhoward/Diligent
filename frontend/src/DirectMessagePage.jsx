import {useState, useEffect, useCallback} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {Container, Box, Typography, List, ListItem,
  ListItemText, TextField, Button} from '@mui/material';
import {useUser} from './useUser';

const DirectMessagePage = () => {
  const {user, setUser} = useUser();
  const {memberEmail} = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userNames, setUserNames] = useState({});
  const navigate = useNavigate();

  const fetchMessages = useCallback(async () => {
    const encodedEmail = encodeURIComponent(memberEmail);
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
    } catch (error) {
      console.error(error);
    }
  }, [user.token, memberEmail]);

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
      await fetchMessages();
      await fetchUserNames();
    };

    fetchData();
  }, [fetchMessages, fetchUserNames]);

  const handleSendMessage = async () => {
    try {
      const response = await fetch(`http://localhost:3010/v0/direct_messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverEmail: memberEmail,
          content: newMessage,
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender_email: user.email,
          receiver_email: memberEmail,
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
    <Container sx={{pb: 10}}>
      <Box display="flex" justifyContent="space-between"
        alignItems="center" width="100%" bgcolor="purple" p={1} mb={2}>
        <Typography variant="h6" color="white" sx={{fontSize: '1.35rem'}}>
          Message to: {userNames[memberEmail] || memberEmail}
        </Typography>
        <Button variant="contained" color="secondary"
          onClick={handleLogout} style={{height: '40px', width: '70px'}}>
          Logout
        </Button>
      </Box>
      <Box flex="1 1 auto" overflow="auto" mb={2} pb={8}>
        <List>
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
      </Box>
      <Box
        position="fixed"
        bottom={56}
        left={0}
        right={0}
        bgcolor="white"
        p={1}
        borderTop="1px solid #ccc"
        display="flex"
        alignItems="center"
        sx={{zIndex: 1}}
      >
        <TextField
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          variant="outlined"
          placeholder="Enter your message"
          size="small"
          sx={{
            'flexGrow': 1,
            'marginRight': 1,
            '& .MuiOutlinedInput-root': {
              height: '40px',
            },
          }}
        />
        <Button
          onClick={handleSendMessage}
          variant="contained"
          color="primary"
          sx={{
            marginLeft: 1,
            height: '40px',
          }}
        >
          Send
        </Button>
      </Box>
    </Container>
  );
};

export default DirectMessagePage;
