import React from 'react';
import {ActivityIndicator} from 'react-native';

import {useAuth} from '../hooks/Auth';

import AuthenticationRoutes from './auth.routes';
import AppRoutes from './app.routes';

const AuthRoutes: React.FC = () => {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        style={{flex: 1, justifyContent: 'center'}}
        color="#ff9000"
      />
    );
  } else {
    return user ? <AppRoutes /> : <AuthenticationRoutes />;
  }
};

export default AuthRoutes;
