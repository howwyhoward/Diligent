-- Users Table
CREATE TABLE users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_data JSONB);

-- Workspaces Table
CREATE TABLE workspaces (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), workspace_data JSONB);

-- Channels Table
CREATE TABLE channels (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), channel_data JSONB);

-- Messages Table
CREATE TABLE messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), message_data JSONB);

-- Direct Messages Table
CREATE TABLE direct_messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), direct_message_data JSONB);

-- User-Workspace Relationships Table
CREATE TABLE user_workspaces (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), relationship_data JSONB);

-- User-Channel Relationships Table
CREATE TABLE user_channels (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), relationship_data JSONB);
