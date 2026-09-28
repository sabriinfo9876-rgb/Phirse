import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { CITIES, getAreasForCity } from '../data/locations';
import { useMarketplace } from '../store/MarketplaceContext';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  redirectTo?: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  redirectTo,
}) => {
  const {
    users,
    isAuthenticated,
    currentUser,
    login,
    registerUser,
    resetUserPassword,
    switchDemoUser,
    logout,
    navigate,
    searchParams,
  } = useMarketplace();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const targetRedirect =
    redirectTo || searchParams.get('redirect') || '/account';

  // Login form state
  const [identifier, setIdentifier] = useState('zainab@phirse.pk');
  const [password, setPassword] = useState('phirse123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupCity, setSignupCity] = useState<string>(CITIES[0]);
  const [signupArea, setSignupArea] = useState<string>(
    getAreasForCity(CITIES[0])[0] || 'PECHS'
  );
  const [sellerType, setSellerType] = useState<'Individual' | 'Frequent Seller'>(
    'Individual'
  );
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  // Forgot password state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const availableAreas = getAreasForCity(signupCity);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!identifier.trim()) {
      setLoginError('Please enter your email address or mobile number.');
      return;
    }
    if (!password) {
      setLoginError('Please enter your password.');
      return;
    }

    const res = login(identifier, password);
    if (!res.success) {
      setLoginError(res.error || 'Invalid credentials.');
      return;
    }

    navigate(targetRedirect);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (fullName.trim().length < 3) {
      setSignupError('Please enter your full name (at least 3 characters).');
      return;
    }
    if (!signupEmail.includes('@') || !signupEmail.includes('.')) {
      setSignupError('Please enter a valid email address.');
      return;
    }
    const cleanDigits = signupPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setSignupError(
        'Please enter a valid Pakistani mobile number (e.g. 0300-1234567).'
      );
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    const res = registerUser({
      name: fullName,
      email: signupEmail,
      phone: signupPhone,
      password: signupPassword,
      city: signupCity,
      area: signupArea,
      sellerType,
    });

    if (!res.success) {
      setSignupError(res.error || 'Could not create account.');
      return;
    }

    navigate(targetRedirect);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!resetIdentifier.trim()) {
      setResetError('Please enter your registered email or mobile number.');
      return;
    }
    setOtpSent(true);
    setOtpCode('4829');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (otpCode.trim() !== '4829') {
      setResetError('Invalid verification code. Use demo OTP code: 4829');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }

    const res = resetUserPassword(resetIdentifier, newPassword);
    if (!res.success) {
      setResetError(res.error || 'Account not found.');
      return;
    }
    navigate(targetRedirect);
  };

  const handleQuickDemoLogin = (userId: string) => {
    switchDemoUser(userId);
    navigate(targetRedirect);
  };

  const getRedirectLabel = (path: string) => {
    if (path.startsWith('/sell')) return 'Sell an Item';
    if (path.startsWith('/messages')) return 'Messages Inbox';
    if (path.startsWith('/offers')) return 'Offers & Negotiations';
    if (path.startsWith('/my-listings')) return 'Seller Dashboard';
    if (path.startsWith('/favorites')) return 'Saved Favorites';
    if (path.startsWith('/account')) return 'Account & Profile';
    return 'Continue';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Contextual Redirect Banner when accessing protected routes */}
      {redirectTo && !isAuthenticated && (
        <div className="mb-6 p-4 rounded-xl bg-[#EBF3F1] border border-[#0F5348]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#0F5348] font-medium">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Please sign in or create a free PHIRSE account to access{' '}
              <strong className="font-bold">
                {getRedirectLabel(redirectTo)}
              </strong>
              .
            </span>
          </div>
          <span className="text-xs text-gray-600">
            Or pick any 1-Click Demo Account on the right →
          </span>
        </div>
      )}

      {/* Active Session Banner if user visits /login while already signed in */}
      {isAuthenticated && (
        <div className="mb-8 p-4 sm:p-5 rounded-xl bg-white border border-gray-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-11 h-11 rounded-full object-cover shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  Currently signed in as {currentUser.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#EBF3F1] text-[#0F5348] text-[11px] font-semibold">
                  Active Session
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentUser.email || 'zainab@phirse.pk'} · {currentUser.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="min-h-[38px] px-4 py-2 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs font-semibold transition-colors"
            >
              Go to Account
            </button>
            <button
              type="button"
              onClick={logout}
              className="min-h-[38px] px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Login / Signup / Forgot Password Card */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-900/10 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Header & Mode Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0F5348]">
                  PHIRSE Pakistan · Account Access
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                  {mode === 'login'
                    ? 'Sign in to your account'
                    : mode === 'signup'
                    ? 'Create your PHIRSE account'
                    : 'Reset your password'}
                </h1>
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#F4F3EF] border border-gray-900/5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setLoginError('');
                  }}
                  className={`min-h-[40px] px-4 py-2 rounded-md text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    mode === 'login'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LogIn className="w-4 h-4 text-[#0F5348]" />
                  <span>Log In (Sign In)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setSignupError('');
                  }}
                  className={`min-h-[40px] px-4 py-2 rounded-md text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-[#0F5348]" />
                  <span>Create Account (Sign Up)</span>
                </button>
              </div>
            )}
          </div>

          {/* MODE 1: SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
                >
                  {loginError}
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-identifier"
                  className="block text-xs font-semibold text-gray-900 mb-1.5"
                >
                  Email Address or Mobile Number *
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    id="auth-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. zainab@phirse.pk or 0300-2418920"
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F5348] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-gray-900"
                  >
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(identifier);
                      setMode('forgot');
                      setOtpSent(false);
                      setResetError('');
                    }}
                    className="text-xs font-semibold text-[#0F5348] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F5348] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 text-gray-400 hover:text-gray-700 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Default demo password for pre-loaded accounts:{' '}
                  <code className="font-mono font-semibold text-gray-800">
                    phirse123
                  </code>
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-[#0F5348] focus:ring-[#0F5348]"
                  />
                  <span>Keep me signed in on this browser</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] px-5 py-3 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span>Sign In to PHIRSE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-center text-gray-600 pt-2">
                New to PHIRSE?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-semibold text-[#0F5348] hover:underline"
                >
                  Create a new account
                </button>
              </p>
            </form>
          )}

          {/* MODE 2: CREATE ACCOUNT (SIGN UP) FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {signupError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
                >
                  {signupError}
                </div>
              )}

              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold text-gray-900 mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ali Raza"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F5348] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    Email Address *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                    <input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="ali@example.com"
                      className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F5348] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="signup-phone"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    Mobile Number (Pakistan) *
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                    <input
                      id="signup-phone"
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0F5348] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="signup-city"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    City *
                  </label>
                  <select
                    id="signup-city"
                    value={signupCity}
                    onChange={(e) => {
                      const nextCity = e.target.value;
                      setSignupCity(nextCity);
                      const areas = getAreasForCity(nextCity);
                      setSignupArea(areas[0] || '');
                    }}
                    className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="signup-area"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    Neighborhood Area *
                  </label>
                  <select
                    id="signup-area"
                    value={signupArea}
                    onChange={(e) => setSignupArea(e.target.value)}
                    className="w-full min-h-[42px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                  >
                    {availableAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-gray-900 mb-1.5">
                  Account Type
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {(['Individual', 'Frequent Seller'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSellerType(type)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        sellerType === type
                          ? 'border-[#0F5348] bg-[#EBF3F1]/60 text-gray-900'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <p className="text-xs font-bold">{type}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {type === 'Individual'
                          ? 'Personal buying & decluttering'
                          : 'Regular curated inventory'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    Password (min 6 chars) *
                  </label>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-semibold text-gray-900 mb-1"
                  >
                    Confirm Password *
                  </label>
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:border-[#0F5348] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[46px] px-5 py-3 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Verified PHIRSE Account</span>
              </button>

              <p className="text-xs text-center text-gray-600 pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-semibold text-[#0F5348] hover:underline"
                >
                  Log in here
                </button>
              </p>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD FLOW */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {resetError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700"
                >
                  {resetError}
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Enter your registered email address or Pakistani mobile
                    number. We will generate a 4-digit verification code to
                    reset your password.
                  </p>
                  <div>
                    <label
                      htmlFor="reset-id"
                      className="block text-xs font-semibold text-gray-900 mb-1"
                    >
                      Email or Mobile Number *
                    </label>
                    <input
                      id="reset-id"
                      type="text"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="e.g. zainab@phirse.pk or 0300-2418920"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-gray-300 text-sm text-gray-900"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Send Verification Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="min-h-[44px] px-4 py-2.5 rounded-lg border border-gray-300 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-[#EBF3F1] border border-[#0F5348]/20 text-xs text-[#0F5348] space-y-1">
                    <p className="font-bold">
                      Verification code sent to {resetIdentifier}
                    </p>
                    <p>
                      Demo OTP Code:{' '}
                      <code className="font-mono font-bold underline">4829</code>{' '}
                      (pre-filled for testing)
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="reset-otp"
                      className="block text-xs font-semibold text-gray-900 mb-1"
                    >
                      4-Digit Verification Code *
                    </label>
                    <input
                      id="reset-otp"
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-gray-300 font-mono text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reset-new-password"
                      className="block text-xs font-semibold text-gray-900 mb-1"
                    >
                      New Password (min 6 characters) *
                    </label>
                    <input
                      id="reset-new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-lg border border-gray-300 text-sm text-gray-900"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Update Password & Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="min-h-[44px] px-4 py-2.5 rounded-lg border border-gray-300 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Security & Trust Footnote */}
          <div className="pt-4 border-t border-gray-900/10 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
              <ShieldCheck className="w-4 h-4 text-[#0F5348]" />
              Verified Pakistani Neighborhood Profiles
            </span>
            <span>·</span>
            <span>Direct In-App Chat & PKR Offers</span>
          </div>
        </div>

        {/* Right Column (5 cols): 1-Click Instant Demo Login Accounts */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-gray-900/10 p-6 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0F5348]" />
                <h2 className="font-display text-base font-bold text-gray-900">
                  1-Click Quick Login (Demo Accounts)
                </h2>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Want to test buyer and seller workflows immediately? Click any
                pre-loaded Pakistani member account below to sign in with one
                click, or fill their credentials into the login form.
              </p>
            </div>

            <div className="space-y-2.5">
              {users.slice(0, 4).map((u) => {
                const isCurrent = isAuthenticated && u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                      isCurrent
                        ? 'border-[#0F5348] bg-[#EBF3F1]/40'
                        : 'border-gray-200 hover:border-gray-300 bg-[#FAF8F5]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-full shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {u.name}
                            </p>
                            {u.verifiedStatus && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0F5348] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>
                              {u.location} · {u.sellerType}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickDemoLogin(u.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0F5348] hover:bg-[#0B3F36] text-white text-xs font-semibold transition-colors shrink-0 flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>1-Click Login</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between gap-2 text-[11px] text-gray-600">
                      <div className="font-mono truncate">
                        <span>{u.email || 'user@phirse.pk'}</span>
                        <span className="mx-1.5 text-gray-400">|</span>
                        <span>Pass: {u.password || 'phirse123'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setIdentifier(u.email || '');
                          setPassword(u.password || 'phirse123');
                          setLoginError('');
                        }}
                        className="text-[#0F5348] font-semibold hover:underline shrink-0 flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Fill Form</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
