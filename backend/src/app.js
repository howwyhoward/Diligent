require('dotenv').config();
const express = require('express');
const cors = require('cors');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const OpenApiValidator = require('express-openapi-validator');
const {Pool} = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// CORS configuration
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3010'];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

const apiSpec = path.join(__dirname, '../api/openapi.yaml');
const apidoc = yaml.load(fs.readFileSync(apiSpec, 'utf8'));

app.use(
  '/v0/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(apidoc),
);

app.use(
  OpenApiValidator.middleware({
    apiSpec: apiSpec,
    validateRequests: true,
    validateResponses: true,
  }),
);

// Database connection
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'localhost',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

// Helper function to execute queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
};

// JWT Secret
const JWT_SECRET = process.env.SECRET;

// Middleware for authenticating JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Function to validate UUID
const isUUID = (str) => {
  const regex =
   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

// Login endpoint
app.get('/v0/login', async (req, res) => {
  const {identifier, password} = req.query;

  if (!identifier || !password) {
    return res.status(400).json(
      {error: 'Identifier and password are required'});
  }

  let userResult;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  if (isEmail) {
    userResult = await query(
      'SELECT user_data FROM users WHERE user_data->>\'email\' = $1',
      [identifier]);
  } else {
    userResult = await query(
      'SELECT user_data FROM users WHERE user_data->>\'username\' = $1',
      [identifier]);
  }

  const user = userResult ? userResult.rows[0] : null;

  if (!user) {
    return res.status(401).json({error: 'Invalid identifier or password'});
  }

  const userData = user.user_data;
  console.log('User data from DB:', userData);

  const isPasswordValid = bcrypt.compareSync(password, userData.password);
  if (!isPasswordValid) {
    return res.status(401).json({error: 'Invalid identifier or password'});
  }

  const token = jwt.sign(
    {email: userData.email, username: userData.username},
    JWT_SECRET, {expiresIn: '1h'});

  return res.json({
    message: 'Login successful',
    token,
    email: userData.email,
    username: userData.username,
    last_state: {
      lastWorkspace: isUUID(userData.last_state.lastWorkspace) ?
        userData.last_state.lastWorkspace : null,
      lastChannel: isUUID(userData.last_state.lastChannel) ?
        userData.last_state.lastChannel : null,
      lastMessage: isUUID(userData.last_state.lastMessage) ?
        userData.last_state.lastMessage : null,
    },
  });
});

// Save user's last state
app.post('/v0/save_state', authenticateToken, async (req, res) => {
  const {email} = req.user;
  const {lastWorkspace, lastChannel, lastMessage} = req.body;

  const updateData = {
    lastWorkspace: isUUID(lastWorkspace) ? lastWorkspace : null,
    lastChannel: isUUID(lastChannel) ? lastChannel : null,
    lastMessage: isUUID(lastMessage) ? lastMessage : null,
  };

  await query(
    `UPDATE users SET user_data = jsonb_set(user_data,
     \'{last_state}\', $1) WHERE user_data->>\'email\' = $2`,
    [JSON.stringify(updateData), email],
  );

  res.json({message: 'State saved successfully'});
});

// Validate token endpoint
app.post('/v0/validate_token', authenticateToken, async (req, res) => {
  const userResult = await query(`SELECT user_data 
    FROM users WHERE user_data->>\'email\' = $1`, [req.user.email]);
  const user = userResult ? userResult.rows[0] : null;

  if (!user) {
    return res.status(404).json({valid: false, error: 'User not found'});
  }

  const userData = user.user_data;
  res.json({
    valid: true,
    email: req.user.email,
    username: req.user.username,
    last_state: {
      lastWorkspace: isUUID(userData.last_state.lastWorkspace) ?
        userData.last_state.lastWorkspace : null,
      lastChannel: isUUID(userData.last_state.lastChannel) ?
        userData.last_state.lastChannel : null,
      lastMessage: isUUID(userData.last_state.lastMessage) ?
        userData.last_state.lastMessage : null,
    },
  });
});

// Get all users (for fetching usernames)
app.get('/v0/users', authenticateToken, async (req, res) => {
  const usersResult = await query('SELECT user_data FROM users');
  const users = usersResult ? usersResult.rows.map((row) => row.user_data) : [];
  return res.json(users);
});

// Get workspaces for a user
app.get('/v0/workspaces', authenticateToken, async (req, res) => {
  const {email} = req.user;

  const result = await query(
    `SELECT w.id::text as id, w.workspace_data->>'name' as name,
     w.workspace_data->>'created_by' as created_by, 
            w.workspace_data->>'description' as description
     FROM workspaces w
     JOIN user_workspaces uw ON (w.id =
      (uw.relationship_data->>'workspace_id')::uuid)
     WHERE uw.relationship_data->>'user_email' = $1`,
    [email],
  );

  const workspaces = result ? result.rows : [];
  return res.json(workspaces);
});

// Get channels for workspace
app.get('/v0/channels', authenticateToken, async (req, res) => {
  const {workspaceId} = req.query;
  const {email} = req.user;

  const workspaceResult = await query(`SELECT * FROM user_workspaces 
    WHERE (relationship_data->>\'workspace_id\')::uuid = $1 
    AND relationship_data->>\'user_email\' = $2`, [workspaceId, email]);

  if (workspaceResult.rows.length === 0) {
    return res.status(403).json(
      {error: 'User does not have access to this workspace'});
  }

  const channelsResult = await query(
    `SELECT id::text, channel_data 
    FROM channels WHERE (channel_data->>\'workspace_id\')::uuid = $1`,
    [workspaceId],
  );

  const channels = channelsResult ? channelsResult.rows.map((row) => {
    const channelData = row.channel_data;
    return {
      id: row.id,
      name: channelData.name,
      workspace_id: channelData.workspace_id,
      created_by: channelData.created_by,
      description: channelData.description,
      created_at: channelData.created_at,
    };
  }) : [];

  return res.json(channels);
});

// Get messages for a channel
app.get('/v0/messages', authenticateToken, async (req, res) => {
  const {channelId} = req.query;

  const messagesResult = await query(`SELECT message_data FROM messages 
    WHERE (message_data->>\'channel_id\')::uuid = $1`, [channelId]);
  const messages = messagesResult ?
    messagesResult.rows.map((row) => row.message_data) : [];

  // Fetch usernames for the messages
  const userEmails = messages.map((msg) => msg.user_email);
  const userResult = await query(`SELECT user_data->>\'email\' as email,
     user_data->>\'username\' as username FROM users 
     WHERE user_data->>\'email\' = ANY($1::text[])`, [userEmails]);
  const userMap = userResult.rows.reduce((acc, row) => {
    acc[row.email] = row.username;
    return acc;
  }, {});

  // Add username to messages
  const messagesWithUsernames = messages.map((msg) => ({
    ...msg,
    username: userMap[msg.user_email] || msg.user_email,
  }));

  return res.json(messagesWithUsernames);
});

// Get channel by ID
app.get('/v0/channels/:channelId', authenticateToken, async (req, res) => {
  const {channelId} = req.params;

  const channelResult = await query(
    'SELECT channel_data FROM channels WHERE id = $1', [channelId]);
  const channel = channelResult ? channelResult.rows[0].channel_data : null;

  if (!channel) {
    return res.status(404).json({error: 'Channel not found'});
  }

  return res.json(channel);
});

// Get direct messages between users
app.get('/v0/direct_messages', authenticateToken, async (req, res) => {
  const {email: userEmail} = req.user;
  const {otherUserEmail} = req.query;

  if (!otherUserEmail) {
    return res.status(400).json({error: 'Other user email is required'});
  }

  // Check if the receiver exists
  const receiverResult = await query(
    'SELECT user_data FROM users WHERE user_data->>\'email\' = $1',
    [otherUserEmail]);
  if (receiverResult.rows.length === 0) {
    return res.status(404).json({error: 'Receiver does not exist'});
  }

  const directMessagesResult = await query(
    `SELECT direct_message_data FROM direct_messages 
    WHERE (direct_message_data->>\'sender_email\' = $1 
    AND direct_message_data->>\'receiver_email\' = $2) 
    OR (direct_message_data->>\'sender_email\' = $2 
    AND direct_message_data->>\'receiver_email\' = $1)`,
    [userEmail, otherUserEmail],
  );
  const directMessages = directMessagesResult ?
    directMessagesResult.rows.map((row) => row.direct_message_data) : [];

  return res.json(directMessages);
});

// Add a new direct message
app.post('/v0/direct_messages', authenticateToken, async (req, res) => {
  const {receiverEmail, content, workspaceId} = req.body;
  const {email: senderEmail} = req.user;

  if (!receiverEmail || !content) {
    return res.status(400).json(
      {error: 'Receiver email and content are required'});
  }

  // Check if the receiver exists
  const receiverResult = await query(
    'SELECT * FROM users WHERE user_data->>\'email\' = $1', [receiverEmail]);

  if (receiverResult.rows.length === 0) {
    return res.status(404).json({error: 'Receiver does not exist'});
  }

  if (workspaceId) {
    // Ensure the sender has access to the workspace
    const userWorkspaceResult = await query(`SELECT * FROM user_workspaces 
      WHERE (relationship_data->>\'workspace_id\')::uuid = $1 
      AND relationship_data->>\'user_email\' = $2`, [workspaceId, senderEmail]);

    if (userWorkspaceResult.rows.length === 0) {
      return res.status(403).json(
        {error: 'Sender does not have access to this workspace'});
    }

    // Ensure the receiver has access to the workspace
    const receiverWorkspaceResult = await query(`
      SELECT * FROM user_workspaces 
      WHERE (relationship_data->>\'workspace_id\')::uuid = $1 
      AND relationship_data->>\'user_email\' = $2`,
    [workspaceId, receiverEmail]);

    if (receiverWorkspaceResult.rows.length === 0) {
      return res.status(403).json(
        {error: 'Receiver does not have access to this workspace'});
    }
  }

  // Insert the direct message
  const result = await query(
    'INSERT INTO direct_messages (direct_message_data) VALUES ($1) RETURNING *',
    [{
      workspace_id: workspaceId || null,
      sender_email: senderEmail,
      receiver_email: receiverEmail,
      content: content,
      created_at: new Date().toISOString(),
    }],
  );

  const newDirectMessage = result ? result.rows[0] : null;

  return res.json(newDirectMessage);
});

// Get list of users for direct messages
app.get('/v0/direct_messages_list', authenticateToken, async (req, res) => {
  const {email: userEmail} = req.user;

  const directMessagesListResult = await query(
    `SELECT DISTINCT ON (direct_message_data->>\'receiver_email\') 
    direct_message_data->>\'receiver_email\' AS other_user_email 
    FROM direct_messages WHERE direct_message_data->>\'sender_email\' = $1 ` +
    'UNION ' +
    `SELECT DISTINCT ON (direct_message_data->>\'sender_email\') 
    direct_message_data->>\'sender_email\' AS other_user_email 
    FROM direct_messages WHERE direct_message_data->>\'receiver_email\' = $1`,
    [userEmail],
  );
  const directMessagesList = directMessagesListResult ?
    directMessagesListResult.rows : [];

  return res.json(directMessagesList);
});

// Add a new message to a channel
app.post('/v0/messages', authenticateToken, async (req, res) => {
  const {channelId, content} = req.body;
  const {email: userEmail} = req.user;

  // Ensure the user has access to the channel
  const userChannelResult = await query(
    `SELECT * FROM user_workspaces uw JOIN channels c 
    ON (uw.relationship_data->>\'workspace_id\')::uuid = 
    (c.channel_data->>\'workspace_id\')::uuid WHERE c.id = $1 
    AND uw.relationship_data->>\'user_email\' = $2`,
    [channelId, userEmail],
  );

  if (userChannelResult.rows.length === 0) {
    return res.status(403).json(
      {error: 'User does not have access to this channel'});
  }

  // Insert the message
  const result = await query(
    'INSERT INTO messages (message_data) VALUES ($1) RETURNING *',
    [{
      channel_id: channelId,
      user_email: userEmail,
      content: content,
      created_at: new Date().toISOString(),
    }],
  );
  const newMessage = result ? result.rows[0] : null;

  return res.json(newMessage);
});

// Add a new channel
app.post('/v0/channels', authenticateToken, async (req, res) => {
  const {name, workspaceId} = req.body;
  const {email: createdBy} = req.user;

  // Check if the user has permission to add a channel to the workspace
  const workspaceResult = await query(`SELECT * FROM workspaces 
    WHERE id = $1 AND workspace_data->>\'created_by\' = $2`,
  [workspaceId, createdBy]);

  if (workspaceResult.rows.length === 0) {
    return res.status(403).json(
      {error: 'Oops, you do not have that permission'});
  }

  const result = await query(
    `INSERT INTO channels (channel_data) VALUES ($1) 
    RETURNING id, channel_data`,
    [{
      name: name,
      workspace_id: workspaceId,
      created_by: createdBy,
      description: '',
    }],
  );
  const newChannel = result ? result.rows[0] : null;

  return res.json({
    id: newChannel.id,
    ...newChannel.channel_data,
  });
});

// Add a new workspace
app.post('/v0/workspaces', authenticateToken, async (req, res) => {
  const {name} = req.body;
  const {email: createdBy} = req.user;
  // Insert the new workspace
  const result = await query(
    `INSERT INTO workspaces (workspace_data) 
       VALUES (jsonb_build_object('name', $1::text,
        'created_by', $2::text, 'description', ''::text)) 
       RETURNING id::text, workspace_data`,
    [name, createdBy],
  );
  const newWorkspace = result ? result.rows[0] : null;

  // Add the user to the workspace
  await query(
    `INSERT INTO user_workspaces (relationship_data) 
       VALUES (jsonb_build_object('user_email',
        $1::text, 'workspace_id', $2::uuid))`,
    [createdBy, newWorkspace.id],
  );

  return res.json({
    id: newWorkspace.id,
    ...newWorkspace.workspace_data,
  });
});

// Add a user to a workspace
app.post('/v0/user_workspaces', authenticateToken, async (req, res) => {
  const {userEmail, workspaceId} = req.body;
  const {email: createdBy} = req.user;

  // Check if the user adding the member is the owner of the workspace
  const workspaceResult = await query(`SELECT * FROM workspaces WHERE id = $1 
    AND workspace_data->>\'created_by\' = $2`, [workspaceId, createdBy]);

  if (workspaceResult.rows.length === 0) {
    return res.status(403).json(
      {error: 'Only the workspace owner can add members'});
  }

  // Check if the user to be added exists in the users table
  const userResult = await query(
    'SELECT * FROM users WHERE user_data->>\'email\' = $1', [userEmail]);

  if (userResult.rows.length === 0) {
    return res.status(400).json({error: 'User to be added does not exist'});
  }

  // Check if the user is already part of the workspace
  const userWorkspaceResult = await query(
    `SELECT * FROM user_workspaces 
    WHERE (relationship_data->>\'user_email\')::text = $1 
    AND (relationship_data->>\'workspace_id\')::uuid = $2`,
    [userEmail, workspaceId]);

  if (userWorkspaceResult.rows.length > 0) {
    return res.status(409).json(
      {error: 'User is already part of the workspace'});
  }

  const result = await query(`INSERT INTO user_workspaces 
    (relationship_data) VALUES ($1) RETURNING *`, [{
    user_email: userEmail,
    workspace_id: workspaceId,
  }]);
  const newUserWorkspace = result ? result.rows[0] : null;

  return res.json(newUserWorkspace);
});

// Get members of a workspace
app.get('/v0/workspace_members', authenticateToken, async (req, res) => {
  const {workspaceId} = req.query;
  const {email: userEmail} = req.user;

  // Ensure the user has access to the workspace
  const userWorkspaceResult = await query(`SELECT * FROM user_workspaces 
    WHERE (relationship_data->>\'workspace_id\')::uuid = $1 
    AND relationship_data->>\'user_email\' = $2`, [workspaceId, userEmail]);

  if (userWorkspaceResult.rows.length === 0) {
    return res.status(403).json(
      {error: 'User does not have access to this workspace'});
  }

  // Fetch workspace members
  const membersResult = await query(
    `SELECT user_data->>\'email\' AS email,
     user_data->>\'username\' AS username FROM users u ` +
    `JOIN user_workspaces uw ON (u.user_data->>\'email\')::text =
     (uw.relationship_data->>\'user_email\')::text ` +
    'WHERE (uw.relationship_data->>\'workspace_id\')::uuid = $1',
    [workspaceId],
  );

  const members = membersResult ? membersResult.rows : [];
  return res.json(members);
});

// Get messages where the user was mentioned
app.get('/v0/mentions', authenticateToken, async (req, res) => {
  const {username} = req.user;

  const mentionsResult = await query(
    `SELECT message_data FROM messages 
    WHERE message_data->>\'content\' ILIKE $1`,
    [`%@${username}%`],
  );

  const mentions = mentionsResult ?
    mentionsResult.rows.map((row) => row.message_data) : [];
  return res.json(mentions);
});

// Search endpoint
app.get('/v0/search', async (req, res) => {
  const {term} = req.query;
  const queryText = `
    SELECT
      messages.message_data->>'content' AS message,
      messages.message_data->>'created_at' AS timestamp,
      workspaces.workspace_data->>'name' AS workspace_name,
      channels.channel_data->>'name' AS channel_name
    FROM
      messages
      JOIN channels ON messages.message_data->>'channel_id' = channels.id::text
      JOIN workspaces ON channels.channel_data->>'workspace_id' =
       workspaces.id::text
    WHERE
      messages.message_data->>'content' ILIKE $1
  `;
  const result = await query(queryText, [`%${term}%`]);
  res.json(result.rows);
});

module.exports = app;
