import {useUser} from './useUser';

const isUUID = (str) => {
  const regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

export const useSaveState = () => {
  const {user} = useUser();

  const saveState = async (lastWorkspace, lastChannel, lastMessage) => {
    if (user) {
      await fetch('http://localhost:3010/v0/save_state', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastWorkspace: isUUID(lastWorkspace) ? lastWorkspace : null,
          lastChannel: isUUID(lastChannel) ? lastChannel : null,
          lastMessage: isUUID(lastMessage) ? lastMessage : null,
        }),
      });
    }
  };

  return saveState;
};
