import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock login - in real app, this would be an API call
    setTimeout(() => {
      const mockUsers = [
        { 
          id: '1', 
          email: 'admin@amet.ac.in', 
          role: 'admin', 
          name: 'Admin User',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
        },
        { 
          id: '2', 
          email: 'employer@company.com', 
          role: 'employer', 
          name: 'HR Manager',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face'
        },
        { 
          id: '3', 
          email: 'alumni@amet.ac.in', 
          role: 'alumni', 
          name: 'John Doe',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
        }
      ];

      const user = mockUsers.find(u => u.email === formData.email) || mockUsers[2];
      onLogin(user);
      setIsLoading(false);
    }, 1000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
            <div className="w-12 h-12 bg-ocean-gradient rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-ocean-100">
            Sign in to your AMET Alumni account
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="glass-card rounded-lg p-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input w-full px-3 py-2 rounded-lg focus:outline-none"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input w-full px-3 py-2 pr-10 rounded-lg focus:outline-none"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-ocean-600 focus:ring-ocean-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm text-ocean-600 hover:text-ocean-700"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-ocean w-full py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-wave"></div>
                  <div className="loading-wave"></div>
                  <div className="loading-wave"></div>
                  <span className="ml-2">Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Demo Users */}
            <div className="mt-6 p-4 bg-ocean-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Users:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Admin: admin@amet.ac.in</p>
                <p>Employer: employer@company.com</p>
                <p>Alumni: alumni@amet.ac.in</p>
                <p className="mt-2 italic">Use any password</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-ocean-100">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-white hover:text-ocean-200 underline"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;