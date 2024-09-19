import {useState} from 'react';
import {Container, Box, Typography, TextField, Button} from '@mui/material';
import {useParams, useNavigate} from 'react-router-dom';
import {useUser} from './useUser';

const AddChannel = () => {
  const {workspaceId} = useParams();
  const [channelName, setChannelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const {user} = useUser();

  const handleAddChannel = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3010/v0/channels', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({name: channelName, workspaceId}),
      });

      const data = await response.json();
      if (response.ok) {
        setChannelName('');
        navigate(`/channel/${data.id}`);
      } else {
        setError(data.error || 'Failed to add channel');
      }
    } catch (err) {
      setError('Failed to add channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Box display="flex" flexDirection="column" alignItems="center"
        justifyContent="center" height="100vh">
        <Typography variant="h4">Add Channel</Typography>
        <TextField
          label="Channel Name"
          variant="outlined"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          margin="normal"
          disabled={loading}
        />
        {error && (
          <Typography color="error" variant="body2" style={{marginTop: 8}}>
            {error}
          </Typography>
        )}
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddChannel}
          disabled={loading}
          style={{marginTop: 16}}
        >
          {loading ? 'Adding...' : 'Add Channel'}
        </Button>
      </Box>
    </Container>
  );
};

export default AddChannel;
