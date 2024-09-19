import {useState, useEffect, useRef, useCallback} from 'react';
import {Container, Box, Typography, TextField, Button, List,
  ListItem, ListItemText} from '@mui/material';
import {useParams} from 'react-router-dom';
import {useUser} from './useUser';
import {formatDate} from './formatDate';
import {formatTime} from './formatTime';

const Channel = () => {
  const {channelId} = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [channelName, setChannelName] = useState('');
  const {user} = useUser();
  const messagesEndRef = useRef(null);

  const saveState = useCallback(async (messageId = null) => {
    if (!user?.token) return;

    await fetch('http://localhost:3010/v0/save_state', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({lastWorkspace: null, lastChannel:
         channelId, lastMessage: messageId}),
    });
  }, [user?.token, channelId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:3010/v0/messages?channelId=${channelId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error(error.message);
      }
    };

    const fetchChannelName = async () => {
      try {
        const response = await fetch(`http://localhost:3010/v0/channels/${channelId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        setChannelName(data.name);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchMessages();
    fetchChannelName();
    saveState(); // Save the channel state when the component loads
  }, [channelId, user.token, saveState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    try {
      const response = await fetch(`http://localhost:3010/v0/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          content: newMessage,
        }),
      });

      const data = await response.json();

      const message = {
        ...data.message_data,
        id: data.id,
        created_at: data.message_data.created_at ?
         new Date(data.message_data.created_at).toISOString() :
          new Date().toISOString(),
        username: user.username, // Include the username from the user context
      };

      setMessages((prevMessages) => [
        ...prevMessages,
        message,
      ]);
      setNewMessage('');
      saveState(message.id); // Save the state with the new message
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessagesByDate = (messages) => {
    const messagesByDate = messages.reduce((acc, message) => {
      const date = new Date(message.created_at).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(message);
      return acc;
    }, {});

    return Object.entries(messagesByDate).sort(([dateA], [dateB]) =>
      new Date(dateA) - new Date(dateB));
  };

  const renderMessages = () => {
    const messagesByDate = formatMessagesByDate(messages);

    return messagesByDate.map(([date, msgs]) => (
      <Box key={date} mb={2}>
        <Typography variant="h6">
          {new Date(date).toDateString() === new Date().toDateString() ?
           'Today' : formatDate(date)}
        </Typography>
        {msgs.map((message) => (
          <ListItem key={message.id}>
            <ListItemText
              primary={
                <>
                  <Typography component="span" variant="body2"
                    color="textPrimary">
                    {message.username || message.user_email}
                  </Typography>
                  <Typography component="span" variant="body2"
                    color="textSecondary" style={{marginLeft: '8px'}}>
                    {formatTime(message.created_at)}
                  </Typography>
                </>
              }
              secondary={message.content}
            />
          </ListItem>
        ))}
      </Box>
    ));
  };

  return (
    <Container>
      <Box display="flex" flexDirection="column"
        height="100vh" position="relative">
        <Box p={2} bgcolor="purple" color="white">
          <Typography variant="h5">{channelName}</Typography>
        </Box>
        <Box p={2} flex={1} overflow="auto" mb="60px">
          <List>
            {renderMessages()}
            <div ref={messagesEndRef} />
          </List>
        </Box>
        <Box display="flex" p={1} position="fixed" bottom="56px"
          width="100%" bgcolor="white">
          <TextField
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            variant="outlined"
            placeholder="Enter your message"
            style={{flexGrow: 1, marginRight: '5px', height: '16px',
              maxWidth: 'calc(100% - 50px)'}}
          />
          <Button onClick={handleSendMessage} color="primary"
            variant="contained" style={{height: '40px',
              width: '70px', marginRight: '100px'}}>
            Send
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Channel;
