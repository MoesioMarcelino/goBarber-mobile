import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
}

interface UserAuthProps {
  token: string;
  user: User;
}

interface CredentialsProps {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User;
  token: string;
  loading: boolean;
  signIn(credentials: CredentialsProps): Promise<void>;
  signOut(): void;
  updateUser(user: User): Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({children}) => {
  const [userAuth, setUserAuth] = useState<UserAuthProps>({} as UserAuthProps);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getStoragedData(): Promise<void> {
      const token = await AsyncStorage.getItem('@GoBarber:token');
      const user = await AsyncStorage.getItem('@GoBarber:user');

      // Ou o getItem pode ser usado assim:
      /**
       * const [token, user] = await AsyncStorage.multiGet('key1', 'key2')
       * if (token[1] && user[1]) {
       *  setUserAuth({token: token[1], user: JSON.pard(user[1])})
       * }
       */

      if (token && user) {
        api.defaults.headers.authorization = `Bearer ${token}`;
        setUserAuth({token, user: JSON.parse(user)});
      }
    }

    getStoragedData();
    setLoading(false);
  }, []);

  const signIn = useCallback(async ({email, password}) => {
    const response = await api.post('/sessions', {email, password});

    const {token, user}: {token: string; user: User} = response.data;

    await AsyncStorage.multiSet([
      ['@GoBarber:token', token],
      ['@GoBarber:user', JSON.stringify(user)],
    ]);

    api.defaults.headers.authorization = `Bearer ${token}`;

    setUserAuth({token, user});
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@GoBarber:token', '@GoBarber:user']);

    setUserAuth({} as UserAuthProps);
  }, []);

  const updateUser = useCallback(
    async (user: User) => {
      await AsyncStorage.setItem('@GoBarber:user', JSON.stringify(user));

      setUserAuth({
        token: userAuth.token,
        user,
      });
    },
    [userAuth.token],
  );

  return (
    <AuthContext.Provider
      value={{
        user: userAuth.user,
        signIn,
        signOut,
        token: userAuth.token,
        loading,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export {AuthProvider, useAuth};
