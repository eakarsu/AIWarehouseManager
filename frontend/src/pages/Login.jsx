import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Sparkles, Mail, KeyRound, User } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login(email, password);
        localStorage.setItem('token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        toast.success('Welcome back!');
        navigate('/');
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const res = await api.register(email, password, name);
        localStorage.setItem('token', res.data.token);
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || (isLogin ? 'Login failed' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = async () => {
    try {
      const res = await api.demoCredentials();
      setEmail(res.data.email);
      setPassword(res.data.password);
      toast.success('Demo credentials filled');
    } catch {
      setEmail('demo@aiinterior.com');
      setPassword('demo123456');
      toast.success('Demo credentials filled');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Interior Design</h1>
          <p className="text-primary-100">Transform your space with AI-powered design</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                isLogin ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                !isLogin ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
              }`}
            >
              Register
            </button>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
                  required
                  minLength={isLogin ? undefined : 6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading
                ? (isLogin ? 'Signing in...' : 'Creating account...')
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Forgot your password?
              </Link>
            </div>
          )}

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={fillDemoCredentials}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Fill Demo Credentials
            </button>
            <p className="text-center text-gray-500 text-sm mt-3">
              Click to auto-fill demo account details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
