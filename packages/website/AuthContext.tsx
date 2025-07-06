import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User,Group } from './types';

interface AuthContextType {
  user: User | null;
  groups: Group[];
  register: (credentials: { email: string; password: string }) => void;
  login: (credentials: { email: string; password: string }) => void;
  logout: () => void;
  joinGroup: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoading(false);
  }, []);

  useEffect(() => {
    const savedGroups = localStorage.getItem("groups");
    if (savedGroups) setGroups(JSON.parse(savedGroups));
  }, [user]);

  const register = ({ email, password }: LoginCredentials) => {
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
    if (existingUsers.some((u: User) => u.email === email)) {
      alert("User already exists!");
      return;
    }

    const newUser = { id: crypto.randomUUID(),
                      email,
                      name: email.split('@')[0],
                      showTitles: true,
                      color: '#'+Math.floor(Math.random()*16777215).toString(16),
                      password
                    };
    localStorage.setItem("users", JSON.stringify([...existingUsers, newUser]));
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    navigate("/");
  };

  type LoginCredentials = { email: string; password: string };

  const login = ({ email, password }: LoginCredentials) => {
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const matched = allUsers.find((u: User) => u.email === email && u.password === password);

    if (matched) {
      setUser(matched);
      localStorage.setItem("user", JSON.stringify(matched));
      navigate("/");
    } else {
      alert("Invalid credentials");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const joinGroup = (id: string) => {
    const savedGroups = JSON.parse(localStorage.getItem("groups") || "[]") as Group[];
    const index = savedGroups.findIndex(g => g.id === id);
    if (index === -1 || !user) return;

    const group = savedGroups[index];
    if (!group.members.includes(user.email)) {
      group.members.push(user.email);
      savedGroups[index] = group;
      localStorage.setItem("groups", JSON.stringify(savedGroups));
    }

    setGroups(savedGroups);
  };

  return (
    <AuthContext.Provider value={{ user, groups, register, login, logout, joinGroup }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};