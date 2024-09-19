import {useState, useEffect, useCallback} from 'react';
import {Container, Box, Typography, List, ListItem,
  ListItemText, Menu, MenuItem, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Button, ListItemButton} from '@mui/material';
import {ArrowDropDown as ArrowDropDownIcon,
  Add as AddIcon} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {useUser} from './useUser';

const Home = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [openAddWorkspaceDialog, setOpenAddWorkspaceDialog] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(false);
  const [openAddChannelDialog, setOpenAddChannelDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [addChannelError, setAddChannelError] = useState('');
  const [openAddTeammateDialog, setOpenAddTeammateDialog] = useState(false);
  const [newTeammateEmail, setNewTeammateEmail] = useState('');
  const [addTeammateError, setAddTeammateError] = useState('');
  const {user, setUser, lastState} = useUser();
  const navigate = useNavigate();

  const saveState = useCallback(async (workspaceId, channelId, messageId) => {
    const token = user?.token;
    if (!token) return;

    await fetch('http://localhost:3010/v0/save_state', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({lastWorkspace: workspaceId,
        lastChannel: channelId, lastMessage: messageId}),
    });
  }, [user?.token]);

  const fetchChannels = useCallback(async (workspaceId) => {
    const response = await fetch(`http://localhost:3010/v0/channels?workspaceId=${workspaceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    setChannels(data);
  }, [user.token]);

  const fetchWorkspaceMembers = useCallback(async (workspaceId) => {
    const response = await fetch(`http://localhost:3010/v0/workspace_members?workspaceId=${workspaceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    setWorkspaceMembers(data);
  }, [user.token]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const response = await fetch('http://localhost:3010/v0/workspaces', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setWorkspaces(data);
      if (data.length > 0) {
        setSelectedWorkspace(data[0]);
        fetchChannels(data[0].id);
        fetchWorkspaceMembers(data[0].id);
        saveState(data[0].id, null, null);
      }
    };

    fetchWorkspaces();
  }, [user.token, fetchChannels, fetchWorkspaceMembers, saveState]);

  useEffect(() => {
    if (lastState.lastChannel) {
      navigate(`/channel/${lastState.lastChannel}`);
    } else if (lastState.lastWorkspace) {
      navigate(`/workspace/${lastState.lastWorkspace}`);
    } else {
      navigate('/home');
    }
  }, [lastState, navigate]);

  const handleWorkspaceChange = (workspaceId) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    setSelectedWorkspace(workspace);
    fetchChannels(workspace.id);
    fetchWorkspaceMembers(workspace.id);
    saveState(workspace.id, null, null);
    handleCloseMenu();
  };

  const handleChannelClick = (channelId) => {
    navigate(`/channel/${channelId}`);
    saveState(selectedWorkspace.id, channelId, null);
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleMemberClick = (memberEmail) => {
    navigate(`/direct-message/${memberEmail}`);
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const handleAddWorkspace = async () => {
    const response = await fetch('http://localhost:3010/v0/workspaces', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name: newWorkspaceName}),
    });

    const data = await response.json();
    if (response.ok) {
      setWorkspaces([...workspaces, data]);
      setOpenAddWorkspaceDialog(false);
    } else {
      console.error(data.error);
    }
  };

  const handleAddChannel = async () => {
    const response = await fetch('http://localhost:3010/v0/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name: newChannelName,
        workspaceId: selectedWorkspace.id}),
    });

    const data = await response.json();
    if (response.ok) {
      setChannels([...channels, data]);
      setOpenAddChannelDialog(false);
      setAddChannelError('');
    } else {
      console.error(data.error);
      setAddChannelError(data.error);
    }
  };

  const handleAddTeammate = async () => {
    const response = await fetch('http://localhost:3010/v0/user_workspaces', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({userEmail: newTeammateEmail,
        workspaceId: selectedWorkspace.id}),
    });

    const data = await response.json();
    if (response.ok) {
      setWorkspaceMembers([...workspaceMembers, {
        email: newTeammateEmail, username: newTeammateEmail.split('@')[0]}]);
      setOpenAddTeammateDialog(false);
      setAddTeammateError('');
    } else {
      console.error(data.error);
      setAddTeammateError(data.error);
    }
  };

  const handleToggleChannels = () => {
    setChannelsOpen(!channelsOpen);
  };

  const handleToggleMembers = () => {
    setMembersOpen(!membersOpen);
  };

  return (
    <Container>
      {selectedWorkspace && (
        <Box display="flex" flexDirection="column" height="100vh">
          <Box display="flex" justifyContent="space-between"
            alignItems="center" width="100%" bgcolor="purple" p={1}>
            <Typography variant="h6" color="white"
              sx={{fontSize: '1.35rem'}}>{selectedWorkspace.name}</Typography>
            <IconButton onClick={handleOpenMenu} style={{color: 'white'}}>
              <ArrowDropDownIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              {workspaces.map((workspace) => (
                <MenuItem key={workspace.id} onClick={() =>
                  handleWorkspaceChange(workspace.id)}>
                  {workspace.name}
                </MenuItem>
              ))}
              <MenuItem onClick={() => setOpenAddWorkspaceDialog(true)}>
                Add Workspace
              </MenuItem>
            </Menu>
          </Box>
          <Box p={1} flex="1 1 auto" overflow="auto">
            <Typography variant="h5" onClick={handleToggleChannels}
              style={{cursor: 'pointer', marginBottom: '4px'}}
              sx={{fontSize: '1.35rem'}}>
              Channels
              <IconButton onClick={handleToggleChannels}>
                <ArrowDropDownIcon />
              </IconButton>
            </Typography>
            {channelsOpen && (
              <Box maxHeight="200px" overflow="auto">
                <List>
                  {channels.map((channel) => (
                    <ListItem key={channel.id} onClick={() =>
                      handleChannelClick(channel.id)} sx={{padding: '4px'}}>
                      <ListItemButton sx={{padding: '4px'}}>
                        <ListItemText primary={channel.name}
                          primaryTypographyProps=
                            {{style: {fontSize: '0.85rem'}}} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  <ListItem onClick={() =>
                    setOpenAddChannelDialog(true)} sx={{padding: '4px'}}>
                    <ListItemButton sx={{padding: '4px'}}>
                      <ListItemText primary="Add Channel"
                        primaryTypographyProps=
                          {{style: {fontSize: '0.85rem'}}} />
                    </ListItemButton>
                    <AddIcon />
                  </ListItem>
                </List>
              </Box>
            )}
            <ListItem onClick={() => setOpenAddTeammateDialog(true)}
              sx={{padding: '4px'}}>
              <ListItemButton sx={{padding: '4px'}}>
                <ListItemText primary="Add Teammate"
                  primaryTypographyProps={{style: {fontSize: '0.85rem'}}} />
              </ListItemButton>
              <AddIcon />
            </ListItem>
          </Box>
          <Box p={1} flex="1 1 auto" overflow="auto" style={{marginTop: '8px'}}>
            <Typography variant="h5" onClick={handleToggleMembers}

              style={{cursor: 'pointer', marginBottom: '4px'}}
              sx={{fontSize: '1.35rem'}}>
              Direct Messages
              <IconButton onClick={handleToggleMembers}>
                <ArrowDropDownIcon />
              </IconButton>
            </Typography>
            {membersOpen && (
              <Box maxHeight="200px" overflow="auto">
                <List>
                  {workspaceMembers.map((member) => (
                    <ListItem key={member.email} onClick={() =>
                      handleMemberClick(member.email)} sx={{padding: '4px'}}>
                      <ListItemButton sx={{padding: '4px'}}>
                        <ListItemText
                          primary={member.username}
                          primaryTypographyProps={{style: {
                            fontSize: '0.85rem'}}}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
          <Button variant="contained" color="secondary"
            onClick={handleLogout} style={{
              position: 'absolute', bottom: 80, right: 20}}>
            Logout
          </Button>
        </Box>
      )}
      <Dialog open={openAddWorkspaceDialog} onClose={() =>
        setOpenAddWorkspaceDialog(false)}>
        <DialogTitle>Add Workspace</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workspace Name"
            type="text"
            fullWidth
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() =>
            setOpenAddWorkspaceDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddWorkspace} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openAddChannelDialog} onClose={() =>
        setOpenAddChannelDialog(false)}>
        <DialogTitle>Add Channel</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Channel Name"
            type="text"
            fullWidth
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
          />
          {addChannelError && (
            <Typography color="error" variant="body2">
              {addChannelError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() =>
            setOpenAddChannelDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddChannel} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openAddTeammateDialog} onClose={() =>
        setOpenAddTeammateDialog(false)}>
        <DialogTitle>Add Teammate</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Teammate Email"
            type="email"
            fullWidth
            value={newTeammateEmail}
            onChange={(e) => setNewTeammateEmail(e.target.value)}
          />
          {addTeammateError && (
            <Typography color="error" variant="body2">
              {addTeammateError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() =>
            setOpenAddTeammateDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddTeammate} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Home;
