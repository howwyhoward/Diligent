import {useState, useCallback} from 'react';
import {Container, Box, Typography, TextField, List, ListItem,
  ListItemText, Button} from '@mui/material';
import {useUser} from './useUser';
import {useNavigate} from 'react-router-dom';

const Search = () => {
  const {user, setUser} = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(async () => {
    if (!searchTerm) return;
    try {
      const response = await fetch(`http://localhost:3010/v0/search?term=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch search results');
      const data = await response.json();
      setSearchResults(data);
      setNoResults(data.length === 0);
    } catch (error) {
      console.error(error);
      setNoResults(true);
    }
  }, [searchTerm, user.token]);

  const highlightText = (text, term) => {
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, index) => (
      part.toLowerCase() === term.toLowerCase() ?
        <span key={index} style={{backgroundColor: 'yellow'}}>{part}</span> :
        part
    ));
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center"
        width="100%" bgcolor="purple" p={1} mb={2}>
        <Typography variant="h6" color="white"
          sx={{fontSize: '1.35rem'}}>Search Messages</Typography>
        <Button variant="contained" color="secondary" onClick={handleLogout}
          style={{height: '40px', width: '70px'}}>
          Logout
        </Button>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center">
        <List>
          {searchResults.map((result, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemText
                primary={`Workspace: ${result.workspace_name} - 
                Channel: ${result.channel_name}`}
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="textPrimary"
                    >
                      {highlightText(result.message, searchTerm)}
                    </Typography>
                    {` - ${new Date(result.timestamp).toLocaleString()}`}
                  </>
                }
              />
            </ListItem>
          ))}
          {noResults && <Typography variant="body2">
            Nothing found...</Typography>}
        </List>
      </Box>
      <Box display="flex" justifyContent="center" alignItems="center"
        position="fixed" bottom={56} width="100%"
        bgcolor="white" p={1} zIndex={1}>
        <TextField
          label="Lookup"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          margin="normal"
          size="small"
          style={{marginRight: 8}}
          InputProps={{
            style: {height: '45px'},
          }}
          InputLabelProps={{
            style: {height: '40px', lineHeight: '30px'},
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearch}
          size="small"
          style={{height: '40px', paddingTop: '10px', paddingBottom: '10px'}}
        >
          Search
        </Button>
      </Box>
    </Container>
  );
};

export default Search;
