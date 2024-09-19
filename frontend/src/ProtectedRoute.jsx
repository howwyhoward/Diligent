import 'react';
import {Navigate} from 'react-router-dom';
import {useUser} from './useUser';
import PropTypes from 'prop-types';

const ProtectedRoute = ({children}) => {
  const {user} = useUser();
  return user ? children : <Navigate to="/" />;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
