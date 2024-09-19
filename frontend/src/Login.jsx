import {useState} from 'react';
import {Container, Box, Typography, TextField, Button, InputAdornment,
  IconButton, FormControlLabel, Checkbox} from '@mui/material';
import {Visibility, VisibilityOff} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {useUser} from './useUser';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const {setUser, setLastState} = useUser();

  const handleLogin = async () => {
    try {
      const response = await fetch(`http://localhost:3010/v0/login?identifier=${encodeURIComponent(identifier)}&password=${encodeURIComponent(password)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();
      if (response.status === 200) {
        setUser({email: data.email, username:
             data.username, token: data.token});
        setLastState(data.last_state);

        // Navigate to the saved state
        if (data.last_state.lastChannel) {
          navigate(`/channel/${data.last_state.lastChannel}`);
        } else if (data.last_state.lastWorkspace) {
          navigate(`/workspace/${data.last_state.lastWorkspace}`);
        } else {
          navigate('/home');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error during login');
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container>
      <Box display="flex" flexDirection="column" alignItems="center"
        justifyContent="center" height="100vh">
        <Typography variant="h4">Login</Typography>
        <TextField
          label="Email or Username"
          variant="outlined"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          margin="normal"
          InputProps={{
            style: {borderWidth: 1, borderColor: 'black',
              width: '250px', height: '40px'},
            inputProps: {
              style: {textAlign: 'center', fontSize: '0.95rem'},
            },
          }}
          InputLabelProps={{
            shrink: true,
            style: {textAlign: 'center', fontSize: '0.9rem'},
          }}
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          InputProps={{
            style: {borderWidth: 1, borderColor: 'black',
              width: '250px', height: '40px'},
            inputProps: {
              style: {textAlign: 'center', fontSize: '0.9rem'},
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                  size="small"
                >
                  {showPassword ? <Visibility fontSize="small" /> :
                   <VisibilityOff fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          InputLabelProps={{
            shrink: true,
            style: {textAlign: 'center', fontSize: '0.95rem'},
          }}
        />
        {error && <Typography color="error">{error}</Typography>}
        <FormControlLabel
          control={<Checkbox checked={rememberMe} onChange={(e) =>
            setRememberMe(e.target.checked)} />}
          label="Remember me"
        />
        <Button variant="contained" color="primary" onClick={handleLogin}
          style={{backgroundColor: 'black'}}>
          Sign in
        </Button>
      </Box>
    </Container>
  );
};

export default Login;
