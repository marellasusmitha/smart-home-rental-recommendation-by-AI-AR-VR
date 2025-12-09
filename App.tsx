import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Landing, Login, Register, ForgotPassword } from './components/Auth';
import TenantDashboard from './components/TenantDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import { supabase } from './supabaseClient';

type View = 'LANDING' | 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'FORGOT_PASSWORD';

const App: React.FC = () => {
  const [view, setView] = useState<View>('LANDING');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id, session.user.email!);
      } else {
        setCurrentUser(null);
        setView('LANDING');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentUser({
          id: data.id,
          email: data.email,
          role: data.role as UserRole,
          name: data.name
        });
        setView('DASHBOARD');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView('LANDING');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (view === 'LANDING') {
    return <Landing onGetStarted={() => setView('REGISTER')} onSignIn={() => setView('LOGIN')} />;
  }

  if (view === 'LOGIN') {
    return (
      <Login 
        onBack={() => setView('LANDING')} 
        onSwitchToRegister={() => setView('REGISTER')} 
        onForgotPassword={() => setView('FORGOT_PASSWORD')}
      />
    );
  }

  if (view === 'REGISTER') {
    return <Register onBack={() => setView('LANDING')} onSwitchToLogin={() => setView('LOGIN')} />;
  }

  if (view === 'FORGOT_PASSWORD') {
    return <ForgotPassword onBack={() => setView('LOGIN')} />;
  }

  if (view === 'DASHBOARD' && currentUser) {
    if (currentUser.role === UserRole.TENANT) {
      return (
        <TenantDashboard 
          user={currentUser}
          onLogout={handleLogout}
        />
      );
    } else {
      return (
        <OwnerDashboard 
          user={currentUser}
          onLogout={handleLogout}
        />
      );
    }
  }

  return <div>Unexpected Error</div>;
};

export default App;
