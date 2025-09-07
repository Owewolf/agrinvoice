import { User } from '@/types/api';
import apiService from './api';
import axios from 'axios';

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'current_user';

export const authService = {
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await apiService.login({ email, password });
      if (response.user && response.token) {
        // Ensure token is stored immediately
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        console.log('✅ Token stored successfully:', response.token.substring(0, 20) + '...');
        return response.user;
      }
      return null;
    } catch (error) {
      console.error('❌ Login failed:', error);
      return null;
    }
  },

  register: async (name: string, email: string, password: string): Promise<User | null> => {
    try {
      const response = await apiService.register({ name, email, password });
      if (response && response.user && response.token) {
        // Ensure token is stored immediately
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        console.log('✅ Registration token stored successfully');
        return response.user;
      }
      throw new Error('Invalid registration response');
    } catch (error) {
      console.error('❌ Registration failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Registration failed');
      }
      throw error;
    }
  },

  logout: (): void => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    console.log('✅ Logged out successfully');
  },

  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  },

  getToken: (): string | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      console.warn('⚠️ No JWT token found in localStorage');
      return null;
    }
    return token;
  },

  isAuthenticated: (): boolean => {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    return !!(token && user);
  }
};

