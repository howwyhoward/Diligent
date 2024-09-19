import {useUser} from './useUser';
import {Container, Typography, Box, Button, Paper} from '@mui/material';
import {useNavigate} from 'react-router-dom';

const Profile = () => {
  const {user, setUser} = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('authToken');
    navigate('/');
  };

  if (!user) return null;

  return (
    <Container maxWidth="sm" sx={{mt: 4}}>
      <Paper elevation={3} sx={{p: 3}}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h4" mb={2} color="primary">Profile</Typography>
          <Typography variant="h6" mb={1}>
            <strong>Username:</strong> {user.username}</Typography>
          <Typography variant="h6" mb={3}>
            <strong>Email:</strong> {user.email}</Typography>
          <Button variant="contained" color="secondary"
            onClick={handleLogout} sx={{mt: 2}}>
            Logout
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;
