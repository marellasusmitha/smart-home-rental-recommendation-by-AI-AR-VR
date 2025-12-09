import React, { useState } from 'react';
import { UserRole } from '../types';
import { Home, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export const Landing: React.FC<{ onGetStarted: () => void, onSignIn: () => void }> = ({ onGetStarted, onSignIn }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-4">
    <div className="max-w-4xl text-center space-y-8 animate-fadeIn">
      <div className="flex justify-center mb-6">
        <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
          <Home size={64} className="text-white" />
        </div>
      </div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Find Your Dream Home with <br />
        <span className="text-yellow-300">AI + AR/VR</span> Visualization
      </h1>
      <p className="text-xl md:text-2xl text-indigo-100 max-w-2xl mx-auto">
        Experience rentals like never before. Smart AI recommendations and immersive 360° views.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
        <button onClick={onGetStarted} className="px-8 py-3 bg-white text-indigo-600 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg">
          Get Started
        </button>
        <button onClick={onSignIn} className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white/10 transition">
          Sign In
        </button>
      </div>
    </div>
  </div>
);

export const Login: React.FC<{ onBack: () => void, onSwitchToRegister: () => void, onForgotPassword: () => void }> = ({ onBack, onSwitchToRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.TENANT); // Role selection is now here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 1. Attempt Login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // 2. If login successful, update the user's role in the DB to match what they selected
      if (data.user) {
         const { error: updateError } = await supabase
           .from('profiles')
           .update({ role: role })
           .eq('id', data.user.id);
         
         if (updateError) {
            console.error("Error updating role:", updateError);
         }
      }

      // 3. Reload page to fetch fresh profile data
      window.location.reload();

    } catch (err: any) {
      setError(err.message || 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Welcome Back</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            <p className="font-bold flex items-center gap-2"><AlertCircle size={16}/> {error}</p>
            {error.includes("Email not confirmed") && (
              <p className="mt-2 text-xs text-gray-700 bg-red-100 p-2 rounded">
                <strong>Tip:</strong> Go to Supabase Dashboard &gt; Authentication &gt; Providers &gt; Email and <strong>uncheck "Confirm email"</strong> to skip verification for dummy emails.
              </p>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={password} onChange={e => setPassword(e.target.value)} />
            <div className="flex justify-end mt-1">
              <button type="button" onClick={onForgotPassword} className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline">
                Forgot Password?
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Login as:</label>
            <div className="flex gap-4">
              <label className={`flex items-center space-x-2 cursor-pointer p-2 border rounded transition-colors w-1/2 justify-center ${role === UserRole.TENANT ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-gray-50 border-gray-300'}`}>
                <input type="radio" name="role" checked={role === UserRole.TENANT} onChange={() => setRole(UserRole.TENANT)} className="text-indigo-600 focus:ring-indigo-500" />
                <span className="text-gray-900 font-medium">Tenant</span>
              </label>
              <label className={`flex items-center space-x-2 cursor-pointer p-2 border rounded transition-colors w-1/2 justify-center ${role === UserRole.OWNER ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-gray-50 border-gray-300'}`}>
                <input type="radio" name="role" checked={role === UserRole.OWNER} onChange={() => setRole(UserRole.OWNER)} className="text-indigo-600 focus:ring-indigo-500" />
                <span className="text-gray-900 font-medium">Owner</span>
              </label>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition font-semibold disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account? <button onClick={onSwitchToRegister} className="text-indigo-600 hover:underline">Sign up</button>
        </p>
        <button onClick={onBack} className="mt-2 w-full text-center text-sm text-gray-400 hover:text-gray-600">Back to Home</button>
      </div>
    </div>
  );
};

export const Register: React.FC<{ onBack: () => void, onSwitchToLogin: () => void }> = ({ onBack, onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    // Role selection REMOVED from here
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(password !== confirm) {
          setError("Passwords do not match");
          return;
      }
      setLoading(true);
      setError(null);

      try {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          // We don't specify role here anymore. 
          // The SQL Trigger will default it to 'TENANT', 
          // but the user will update it upon their first Login.
          options: {
            data: {
              name: email.split('@')[0]
            }
          }
        });

        if (authError) throw authError;

        if (data.user && !data.session) {
           alert("Registration successful! Please check your email to confirm your account (or disable 'Confirm email' in Supabase settings for dummy emails).");
           onSwitchToLogin();
        } else if (data.user && data.session) {
           alert("Registration successful! You are now logged in.");
           // App.tsx handles redirection
        }

      } catch (err: any) {
        setError(err.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</h2>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input type="password" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            {/* Role Radio Buttons Removed */}
            <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition font-semibold disabled:opacity-50">
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account? <button onClick={onSwitchToLogin} className="text-indigo-600 hover:underline">Login</button>
          </p>
          <button onClick={onBack} className="mt-2 w-full text-center text-sm text-gray-400 hover:text-gray-600">Back to Home</button>
        </div>
      </div>
    );
};

export const ForgotPassword: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        {!isSubmitted ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">Reset Password</h2>
            {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
            <p className="text-center text-gray-500 mb-6 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email" 
                  required 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition font-semibold disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <button onClick={onBack} className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft size={16} /> Back to Login
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Link Sent!</h3>
            <p className="mt-2 text-sm text-gray-500">
              If an account exists for {email}, we have sent a password reset link to it.
            </p>
            <button 
              onClick={onBack} 
              className="mt-6 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};