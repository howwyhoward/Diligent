import {useState, useEffect, useCallback} from 'react';
import {Container, Box, Typography, List, ListItem,
  ListItemText, Button} from '@mui/material';
import {useUser} from './useUser';
import {useNavigate} from 'react-router-dom';

const MentionsPage = () => {
  const {user, setUser} = useUser();
  const [taggedMessages, setTaggedMessages] = useState([]);
  const [userNames, setUserNames] = useState({});
  const navigate = useNavigate();

  const fetchTaggedMessages = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3010/v0/mentions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tagged messages');
      const data = await response.json();
      setTaggedMessages(data);
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
      await fetchTaggedMessages();
      await fetchUserNames();
    };

    fetchData();
  }, [fetchTaggedMessages, fetchUserNames]);

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between"
        alignItems="center" width="100%" bgcolor="purple" p={1} mb={2}>
        <Typography variant="h6" color="white"
          sx={{fontSize: '1.35rem'}}>Mentions</Typography>
        <Button variant="contained" color="secondary"
          onClick={handleLogout} style={{height: '40px', width: '70px'}}>
          Logout
        </Button>
      </Box>
      <List>
        {taggedMessages.map((message, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={`${userNames[message.user_email] ||
                 message.user_email}: ${message.content}`}
              secondary={new Date(message.created_at).toLocaleString()}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default MentionsPage;
