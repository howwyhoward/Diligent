import {useState, createContext} from 'react';
import PropTypes from 'prop-types';

export const UserContext = createContext();

export const UserProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [lastState, setLastState] = useState(
      {lastWorkspace: null, lastChannel: null, lastMessage: null});

  return (
    <UserContext.Provider value={{user, setUser, lastState, setLastState}}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
