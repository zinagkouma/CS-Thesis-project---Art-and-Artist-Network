import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';


import {useNavigate} from 'react-router-dom';
import {getAvatarURL} from '../utils/avatarUtils';



export interface User {
  id?: string;
  username: string;
  avatar: string; 
  email: string; 
  role:'User'|'Artist'|'Admin';
  token?: string;
}


interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean; 
  login: (creds: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  authHeader: () => HeadersInit; 
}

interface AuthProviderProps {
  children: ReactNode;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  //Set true initially, so we wait for storage check 
  const [loading, setLoading] = useState<boolean>(true); 

  const isAuthenticated = !!user; // If user is null, not authenticated
  const isAdmin = user?.role === 'Admin';

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedToken) setToken(savedToken);
    
    //Stop loading once storage is checked 
    setLoading(false); 
  }, []);


  const authHeader = (): HeadersInit => 
    token ? { Authorization: `Bearer ${token}` } : {};


  const login = async (creds: {email: string; password: string}) => {
    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(creds)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");  
      }

      const {token: jwt, user: u} = data; 

   // Extracting user data from the server
   const me: User = {
      id: u.id,
      username: u.username,
      avatar: u.avatar || getAvatarURL(u.username), // Use default avatar if none provided
      email: u.email,
      role: u.role
      
    };

   setUser(me);
   setToken(jwt);
   localStorage.setItem('user', JSON.stringify(me));
   localStorage.setItem('token', jwt);
    
  } catch (err) {
    console.error(err);
    throw err; 
  }
};

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    setUser(null);
    setToken(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isAdmin, loading, login, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy consumption
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
};
