import {Box, IconButton} from '@mui/material';
import {Home as HomeIcon, Chat as ChatIcon, AlternateEmail as
MentionIcon, Search as SearchIcon, Person as PersonIcon}
  from '@mui/icons-material';
import {Link} from 'react-router-dom';
import {useUser} from './useUser';

const BottomNavigation = () => {
  const {user} = useUser();

  if (!user) return null;

  return (
    <Box display="flex" justifyContent="space-around" position="fixed"
      bottom={0} width="100%" bgcolor="white" boxShadow={1}>
      <Link to="/home"><IconButton><HomeIcon /></IconButton></Link>
      <Link to="/direct-messages"><IconButton><ChatIcon /></IconButton></Link>
      <Link to="/mentions"><IconButton><MentionIcon /></IconButton></Link>
      <Link to="/search"><IconButton><SearchIcon /></IconButton></Link>
      <Link to="/profile"><IconButton><PersonIcon /></IconButton></Link>
    </Box>
  );
};

export default BottomNavigation;
