import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://budget-app.vercel.app';

interface User {
  id: string;
  email: string;
  is_verified: boolean;
  remember_token?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<{ data?: any; error?: string }>;
  verifyEmail: (userId: string, code: string) => Promise<{ data?: any; error?: string }>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ data?: any; error?: string; userId?: string }>;
  loginWithGoogle: () => Promise<{ data?: any; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ data?: any; error?: string }>;
  verifyResetCode: (userId: string, code: string) => Promise<{ data?: any; error?: string }>;
  resetPassword: (userId: string, verificationId: string, newPassword: string) => Promise<{ data?: any; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      await checkUser();
      if (isMounted) setLoading(false);
    };
    init();
    return () => { isMounted = false; };
  }, []);

  const checkUser = async () => {
    try {
      const rememberToken = await SecureStore.getItemAsync('rememberToken');
      if (rememberToken) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('remember_token', rememberToken)
          .eq('is_verified', true)
          .single();

        if (data && !error) {
          setUser(data);
          return;
        } else {
          await SecureStore.deleteItemAsync('rememberToken');
        }
      }
    } catch (err) {
      console.error('Check user error:', err);
    }
    setUser(null);
  };

  const signup = async (email: string, password: string) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) return { error: 'Bu email adresi zaten kayıtlı' };

      const passwordHash = await bcrypt.hash(password, 10);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ email, password_hash: passwordHash, is_verified: false })
        .select()
        .single();

      if (insertError) return { error: 'Kayıt sırasında hata oluştu' };

      const response = await fetch(`${API_URL}/api/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUser.id, email: newUser.email, type: 'signup' }),
      });

      if (!response.ok) return { error: 'Email gönderilemedi' };

      return { data: newUser };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const verifyEmail = async (userId: string, code: string) => {
    try {
      const { data: verificationData, error: verifyError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', code)
        .eq('type', 'signup')
        .eq('used', false)
        .single();

      if (verifyError || !verificationData) return { error: 'Geçersiz kod' };
      if (new Date(verificationData.expires_at) < new Date()) return { error: 'Kodun süresi dolmuş' };

      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', verificationData.id);

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) return { error: 'Doğrulama hatası' };

      setUser(updatedUser);
      return { data: updatedUser };
    } catch (error) {
      console.error('Verify email error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) return { error: 'Email veya şifre hatalı' };

      const passwordMatch = await bcrypt.compare(password, userData.password_hash);
      if (!passwordMatch) return { error: 'Email veya şifre hatalı' };

      if (!userData.is_verified) {
        return { error: 'Email adresinizi doğrulamanız gerekiyor', userId: userData.id };
      }

      if (rememberMe) {
        const token = `${Date.now()}-${Math.random().toString(36).substr(2)}`;
        await supabase.from('users').update({ remember_token: token }).eq('id', userData.id);
        await SecureStore.setItemAsync('rememberToken', token);
        userData.remember_token = token;
      }

      setUser(userData);
      return { data: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const logout = async () => {
    try {
      if (user?.remember_token) {
        await supabase.from('users').update({ remember_token: null }).eq('id', user.id);
      }
      await SecureStore.deleteItemAsync('rememberToken');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) return { error: 'Bu email adresiyle kayıtlı kullanıcı bulunamadı' };

      const response = await fetch(`${API_URL}/api/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id, email: userData.email, type: 'password_reset' }),
      });

      if (!response.ok) return { error: 'Email gönderilemedi' };

      return { data: { userId: userData.id } };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const verifyResetCode = async (userId: string, code: string) => {
    try {
      const { data: verificationData, error: verifyError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', code)
        .eq('type', 'password_reset')
        .eq('used', false)
        .single();

      if (verifyError || !verificationData) return { error: 'Geçersiz kod' };
      if (new Date(verificationData.expires_at) < new Date()) return { error: 'Kodun süresi dolmuş' };

      return { data: { verificationId: verificationData.id } };
    } catch (error) {
      console.error('Verify reset code error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const getOrCreateOAuthUser = async (email: string): Promise<{ data?: User; error?: string }> => {
    try {
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) return { error: 'Kullanıcı bilgisi alınamadı' };

      if (existingUser) {
        if (!existingUser.is_verified) {
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ is_verified: true })
            .eq('id', existingUser.id)
            .select()
            .single();
          if (updateError) return { error: 'Kullanıcı güncellenemedi' };
          return { data: updatedUser };
        }
        return { data: existingUser };
      }

      const randomPassword = Math.random().toString(36) + Date.now().toString(36);
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ email, password_hash: passwordHash, is_verified: true })
        .select()
        .single();

      if (insertError) return { error: 'Google ile giriş sırasında kullanıcı oluşturulamadı' };
      return { data: newUser };
    } catch (err) {
      console.error('getOrCreateOAuthUser error:', err);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const loginWithGoogle = async (): Promise<{ data?: any; error?: string }> => {
    try {
      const redirectUri = makeRedirectUri({ scheme: 'budgetapp', path: 'google-auth' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri, skipBrowserRedirect: true },
      });

      if (error || !data.url) return { error: 'Google ile giriş başlatılamadı' };

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type !== 'success') return { error: 'Google ile giriş iptal edildi' };

      // Fragment'tan access/refresh token çıkar
      const url = result.url;
      const hashPart = url.includes('#') ? url.split('#')[1] : '';
      const params = new URLSearchParams(hashPart);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) return { error: 'Google oturumu alınamadı' };

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError || !sessionData.session?.user?.email) return { error: 'Google oturumu geçersiz' };

      const { data: userData, error: userError } = await getOrCreateOAuthUser(sessionData.session.user.email);
      if (userError) return { error: userError };

      setUser(userData!);
      return { data: userData };
    } catch (err) {
      console.error('Google login error:', err);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  const resetPassword = async (userId: string, verificationId: string, newPassword: string) => {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);

      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', userId);

      if (updateError) return { error: 'Şifre güncellenemedi' };

      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', verificationId);

      return { data: { success: true } };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'Beklenmeyen bir hata oluştu' };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signup, verifyEmail, login, loginWithGoogle, logout, forgotPassword, verifyResetCode, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
