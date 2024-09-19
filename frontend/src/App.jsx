import {useEffect, useState} from 'react';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import {BrowserRouter as Router, Routes, Route,
  useNavigate} from 'react-router-dom';
import Login from './Login';
import Home from './Home';
import Channel from './Channel';
import AddChannel from './AddChannel';
import DirectMessages from './DirectMessages';
import DirectMessagePage from './DirectMessagePage';
import BottomNavigation from './BottomNavigation';
import ProtectedRoute from './ProtectedRoute';
import {UserProvider} from './UserContext';
import {useUser} from './useUser';
import MentionsPage from './MentionsPage';
import Search from './Search';
import Profile from './Profile';

const theme = createTheme({
  typography: {
    fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    h4: {fontWeight: 400},
  },
});

const AppContent = () => {
  const {user, setUser, setLastState} = useUser();
  const navigate = useNavigate();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const token = user?.token;

    if (token && !hasNavigated) {
      fetch('http://localhost:3010/v0/validate_token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
          .then((response) => response.json())
          .then((data) => {
            if (data.valid) {
              setUser({email: data.email, username: data.username, token});
              setLastState(data.last_state);
              const {lastWorkspace, lastChannel} = data.last_state;
              if (lastWorkspace) {
                if (lastChannel) {
                  navigate(`/channel/${lastChannel}`);
                } else {
                  navigate(`/workspace/${lastWorkspace}`);
                }
              } else {
                navigate('/home');
              }
              setHasNavigated(true);
            } else {
              navigate('/');
            }
          })
          .catch(() => {
            navigate('/');
          });
    }
  }, [setUser, setLastState, navigate, user, hasNavigated]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element=
          {<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/channel/:channelId" element=
          {<ProtectedRoute><Channel /></ProtectedRoute>} />
        <Route path="/add-channel/:workspaceId" element=
          {<ProtectedRoute><AddChannel /></ProtectedRoute>} />
        <Route path="/workspace/:workspaceId" element=
          {<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/direct-messages" element=
          {<ProtectedRoute><DirectMessages /></ProtectedRoute>} />
        <Route path="/direct-message/:memberEmail" element=
          {<ProtectedRoute><DirectMessagePage /></ProtectedRoute>} />
        <Route path="/mentions" element=
          {<ProtectedRoute><MentionsPage /></ProtectedRoute>} />
        <Route path="/search" element=
          {<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/profile" element=
          {<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
      {user && <BottomNavigation />}
    </>
  );
};

const App = () => (
  <ThemeProvider theme={theme}>
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  </ThemeProvider>
);

export default App;
