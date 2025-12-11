import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/wellness/ui/Card';
import { Button } from '../../components/wellness/ui/Button';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);

  // Check if user is already logged in
  // Only redirect if they have completed onboarding (to dashboard)
  // Otherwise, show the login form (they can continue to onboarding if needed)
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User is already logged in
          // If they have a session, they have a password = onboarding is complete
          // Redirect straight to dashboard
          console.log('[Login] User already has session (has password = onboarding complete) - redirecting to dashboard');
          navigate('/wellness/dashboard', { replace: true });
          return;
        } else {
          setIsAlreadyLoggedIn(false);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!supabase) {
      setError('Supabase is not configured. Please contact support.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data.session) {
        // Successfully logged in
        // If they can log in, they have a password = onboarding is complete
        // Redirect straight to dashboard
        console.log('[Login] User logged in successfully (has password = onboarding complete) - redirecting to dashboard');
        navigate('/wellness/dashboard', { replace: true });
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess(false);
    setIsResettingPassword(true);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsResettingPassword(false);
      return;
    }

    if (!supabase) {
      setError('Supabase is not configured. Please contact support.');
      setIsResettingPassword(false);
      return;
    }

    try {
      // Get the current origin for the redirect URL
      const redirectUrl = `${window.location.origin}/wellness/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        setError(resetError.message || 'Failed to send password reset email. Please try again.');
        setIsResettingPassword(false);
        return;
      }

      // Success - show success message
      setResetSuccess(true);
      setIsResettingPassword(false);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsResettingPassword(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo/Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="text-slate-600">
            Sign in to access your legal dashboard and documents
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            {isAlreadyLoggedIn && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
                <CheckCircle className="text-blue-600 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">You're already logged in</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Continue to your{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/wellness/onboarding')}
                      className="underline font-medium hover:text-blue-900"
                    >
                      assessment
                    </button>
                    {' '}or{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/wellness/dashboard')}
                      className="underline font-medium hover:text-blue-900"
                    >
                      dashboard
                    </button>
                  </p>
                </div>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="text-red-600 mt-0.5" size={18} />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  {!showForgotPassword && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!showForgotPassword}
                    disabled={isLoading || showForgotPassword}
                  />
                </div>
              </div>

              {showForgotPassword && (
                <div className="space-y-4">
                  {resetSuccess ? (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2">
                      <CheckCircle className="text-green-600 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-medium text-green-800">Password reset email sent!</p>
                        <p className="text-xs text-green-700 mt-1">
                          Check your inbox at {email} and click the link to reset your password.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600">
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={isResettingPassword || !email}
                          className="flex-1"
                        >
                          {isResettingPassword ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            'Send Reset Link'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetSuccess(false);
                            setError('');
                          }}
                          disabled={isResettingPassword}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!showForgotPassword && (
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={isLoading || !email || !password}
                  className="text-lg h-12"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="ml-2" size={18} />
                    </>
                  )}
                </Button>
              )}
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm text-center text-slate-600">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/wellness/onboarding')}
                  className="text-brand-600 hover:text-brand-700 font-medium"
                >
                  Get your customized legal documents
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-xs text-center text-slate-500">
          Having trouble?{' '}
          <a href="mailto:chad@consciouscounsel.ca" className="text-brand-600 hover:text-brand-700 font-medium underline">
            Contact us here.
          </a>
        </p>
      </div>
    </div>
  );
};
