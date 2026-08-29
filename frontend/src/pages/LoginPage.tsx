import React, { useState } from 'react';
import {
  Compass,
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Server,
  Database,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Radar,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface DemoRoleCard {
  id: 'commander' | 'analyst' | 'surveillance' | 'inspector';
  name: string;
  role: string;
  agency: string;
  email: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_ROLES: DemoRoleCard[] = [
  {
    id: 'commander',
    name: 'Cmdr. Vikram Malhotra',
    role: 'Indian Coast Guard Commander',
    agency: 'Indian Coast Guard (ICG) - Western Command',
    email: 'commander@marinetrace.org',
    badgeColor: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    icon: Shield,
  },
];

export const LoginPage: React.FC = () => {
  const { login, register, loginAsDemo, authError, clearAuthError, dockerTelemetry, backendOnline } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form states
  const [identifier, setIdentifier] = useState<string>('commander@marinetrace.org');
  const [password, setPassword] = useState<string>('admin');

  // Register Form states
  const [regEmail, setRegEmail] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<string>('Maritime Incident Analyst');
  const [regAgency, setRegAgency] = useState<string>('Coast Guard Environmental Division');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setSubmitting(true);
    try {
      await login({
        email_or_username: identifier,
        password,
      });
    } catch {
      // Handled by context authError
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regUsername || !regFullName || !regPassword) return;
    setSubmitting(true);
    try {
      await register({
        email: regEmail,
        username: regUsername,
        full_name: regFullName,
        password: regPassword,
        role: regRole,
        agency: regAgency,
      });
    } catch {
      // Handled by context authError
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoClick = async (roleId: 'commander' | 'analyst' | 'surveillance' | 'inspector') => {
    setSubmitting(true);
    clearAuthError();
    try {
      await loginAsDemo(roleId);
    } catch {
      // Handled by context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen w-screen flex items-center justify-center p-4 sm:p-6 overflow-x-hidden font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#050811] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Right Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all shadow-md cursor-pointer ${
            isDark
              ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:text-white'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 hover:text-slate-950'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[11px]">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Background Ambient Glow & Radar Circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[140px] ${
            isDark ? 'bg-cyan-900/15' : 'bg-sky-200/50'
          }`}
        />
        <div
          className={`absolute -bottom-[20%] -right-[10%] w-[700px] h-[700px] rounded-full blur-[160px] ${
            isDark ? 'bg-blue-900/15' : 'bg-blue-200/40'
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[180px] ${
            isDark ? 'bg-sky-950/20' : 'bg-cyan-100/60'
          }`}
        />

        {/* Tactical Radar Concentric Circles */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border ${
            isDark ? 'border-cyan-500/5' : 'border-sky-500/10'
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full border ${
            isDark ? 'border-cyan-500/10' : 'border-sky-500/15'
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border ${
            isDark ? 'border-cyan-500/15' : 'border-sky-500/20'
          }`}
        />

        {/* Fine coordinate matrix grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <div
            className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-xs font-mono mb-1 ${
              isDark
                ? 'bg-slate-900/90 border-slate-800 text-cyan-400'
                : 'bg-white border-slate-300 text-sky-800 shadow-sm font-semibold'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>OPERATIONAL MARITIME SURVEILLANCE SUITE</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 p-0.5 shadow-lg shadow-sky-500/20">
              <div
                className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                  isDark ? 'bg-[#080d1a]' : 'bg-white'
                }`}
              >
                <Compass className={`w-6 h-6 animate-pulse ${isDark ? 'text-cyan-400' : 'text-sky-600'}`} />
              </div>
            </div>
            <h1
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isDark
                  ? 'bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent'
                  : 'text-slate-950 font-black tracking-tight'
              }`}
            >
              MarineTrace
            </h1>
          </div>
          <p className={`text-xs sm:text-sm max-w-lg mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
            Sentinel-1 SAR Detection • OpenDrift Trajectory Backtracking • AIS Vessel Attribution
          </p>
        </div>

        {/* Main Card Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Quick 1-Click Demo Operator Logins */}
          <div
            className={`lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl border backdrop-blur-xl space-y-4 ${
              isDark
                ? 'bg-[#090e1a]/90 border-slate-800/80 shadow-2xl text-slate-100'
                : 'bg-white border-slate-200/90 shadow-xl text-slate-900'
            }`}
          >
            <div className="space-y-1.5">
              <div
                className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                  isDark ? 'text-cyan-400' : 'text-sky-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Instant Operator Access</span>
              </div>
              <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-950'}`}>
                Coast Guard Officer Access
              </h2>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Click below to immediately authenticate as the Duty Coast Guard Commander and access the full SAR oil spill investigation workspace.
              </p>
            </div>

            <div className="space-y-2.5 my-2">
              {DEMO_ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleDemoClick(role.id)}
                    disabled={submitting}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group cursor-pointer disabled:opacity-50 ${
                      isDark
                        ? 'bg-slate-900/70 hover:bg-slate-800/60 border-slate-800/90 hover:border-cyan-500/50 text-slate-100'
                        : 'bg-slate-50 hover:bg-sky-50/70 border-slate-200 hover:border-sky-500 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                          isDark
                            ? 'bg-slate-800 border-slate-700/80 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30'
                            : 'bg-white border-slate-200 group-hover:bg-sky-100/80 group-hover:border-sky-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold truncate transition-colors ${
                              isDark ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-950 group-hover:text-sky-700'
                            }`}
                          >
                            {role.name}
                          </span>
                        </div>
                        <span className={`text-[10px] truncate block ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                          {role.role}
                        </span>
                        <span className={`text-[9px] font-mono truncate block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          {role.agency}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 pl-2">
                      <span
                        className={`text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity font-bold hidden sm:inline ${
                          isDark ? 'text-cyan-400' : 'text-sky-700'
                        }`}
                      >
                        Sign In
                      </span>
                      <ArrowRight
                        className={`w-3.5 h-3.5 group-hover:translate-x-0.5 transition-all ${
                          isDark ? 'text-slate-600 group-hover:text-cyan-400' : 'text-slate-400 group-hover:text-sky-600'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Docker Backend Live Telemetry Card */}
            <div
              className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${
                isDark
                  ? 'bg-[#060a14] border-cyan-500/20 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex items-center gap-1.5 font-semibold text-[11px] ${
                    backendOnline
                      ? isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'
                      : isDark ? 'text-cyan-300' : 'text-sky-700 font-bold'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`}
                  />
                  {backendOnline ? 'Docker Container Connected' : 'Standalone Simulation Mode'}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                    backendOnline
                      ? isDark
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : isDark
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        : 'bg-sky-50 text-sky-700 border-sky-300'
                  }`}
                >
                  {backendOnline ? (dockerTelemetry?.is_dockerized ? 'Docker Engine' : 'FastAPI Live') : 'Client Ready'}
                </span>
              </div>

              <div
                className={`grid grid-cols-2 gap-2 text-[10px] pt-1 border-t ${
                  isDark ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Server className={`w-3 h-3 shrink-0 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`} />
                  <span className="truncate">
                    ID: {dockerTelemetry?.container_id || 'marinetrace-backend'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className={`w-3 h-3 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>SQLite Persisted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Custom Login & Registration Form */}
          <div
            className={`lg:col-span-7 p-6 sm:p-8 rounded-2xl border backdrop-blur-xl flex flex-col justify-between space-y-5 ${
              isDark
                ? 'bg-[#090e1a]/95 border-slate-800 shadow-2xl text-slate-100'
                : 'bg-white border-slate-200 shadow-xl text-slate-900'
            }`}
          >
            {/* Mode Switcher Tabs */}
            <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div
                className={`flex items-center gap-2 p-1 rounded-lg border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearAuthError();
                  }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    mode === 'login'
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-sky-600 text-white shadow-sm'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Operator Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    clearAuthError();
                  }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    mode === 'register'
                      ? isDark
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-sky-600 text-white shadow-sm'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Register Account
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-1">
                <Radar className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-500' : 'text-sky-600'}`} />
                <span>SECURE CHANNEL</span>
              </div>
            </div>

            {/* Error Banner */}
            {authError && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 animate-in fade-in ${
                  isDark
                    ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
                <div className="flex-1">
                  <strong className={`block font-semibold mb-0.5 ${isDark ? 'text-rose-300' : 'text-rose-950'}`}>
                    Authentication Alert
                  </strong>
                  <p className="text-[11px] leading-relaxed">{authError}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    <Mail className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`} />
                    <span>Email Address or Username</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="commander@marinetrace.org"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition-all font-mono outline-none shadow-sm ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder:text-slate-600'
                        : 'bg-white border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 text-slate-950 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`} />
                      <span>Security Password</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Default: <code className={`font-bold ${isDark ? 'text-cyan-400' : 'text-sky-700'}`}>admin</code>)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-xs transition-all font-mono outline-none pr-10 shadow-sm ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-slate-100 placeholder:text-slate-600'
                          : 'bg-white border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 text-slate-950 placeholder:text-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className={`flex items-center justify-between text-xs pt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className={`rounded focus:ring-0 w-3.5 h-3.5 ${
                        isDark
                          ? 'border-slate-700 bg-slate-900 text-cyan-500'
                          : 'border-slate-300 bg-white text-sky-600'
                      }`}
                    />
                    <span className="text-[11px] font-medium">Remember operator session</span>
                  </label>
                  <span className={`text-[11px] font-semibold ${isDark ? 'text-cyan-400/80' : 'text-sky-700'}`}>
                    Docker Synchronized
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                    isDark
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 shadow-cyan-500/20'
                      : 'bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white shadow-sky-600/25'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-slate-950' : 'text-white'}`} />
                      <span>Authenticating with Docker Host...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authorize Operator Access</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      <UserIcon className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`} />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Lt. David Sterling"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none shadow-sm ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-700/80 focus:border-cyan-400 text-slate-100 placeholder:text-slate-600'
                          : 'bg-white border-slate-300 focus:border-sky-600 text-slate-950 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      <Mail className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`} />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="david@coastguard.gov"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none shadow-sm ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-700/80 focus:border-cyan-400 text-slate-100 placeholder:text-slate-600'
                          : 'bg-white border-slate-300 focus:border-sky-600 text-slate-950 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Username</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="dsterling"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none font-mono shadow-sm ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-700/80 focus:border-cyan-400 text-slate-100 placeholder:text-slate-600'
                          : 'bg-white border-slate-300 focus:border-sky-600 text-slate-950 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none shadow-sm ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-700/80 focus:border-cyan-400 text-slate-100 placeholder:text-slate-600'
                          : 'bg-white border-slate-300 focus:border-sky-600 text-slate-950 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Operator Role</label>
                    <input
                      type="text"
                      required
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      placeholder="Maritime Intelligence Officer"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none shadow-sm ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-700/80 focus:border-cyan-400 text-slate-100 placeholder:text-slate-600'
                          : 'bg-white border-slate-300 focus:border-sky-600 text-slate-950 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                      <Building2 className={`w-3 h-3 ${isDark ? 'text-cyan-400' : 'text-sky-600'}`} />
                      <span>Agency / Command</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regAgency}
                      onChange={(e) => setRegAgency(e.target.value)}
                      placeholder="National Maritime Center"
                      className={`w-full px-3 py-2 rounded-lg border text-xs outline-none shadow-sm ${
                        isDark
                          ? 'bg-slate-900/90 border-slate-700/80 focus:border-cyan-400 text-slate-100 placeholder:text-slate-600'
                          : 'bg-white border-slate-300 focus:border-sky-600 text-slate-950 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full mt-3 py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                    isDark
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                      : 'bg-sky-600 hover:bg-sky-500 text-white'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className={`w-4 h-4 animate-spin ${isDark ? 'text-slate-950' : 'text-white'}`} />
                      <span>Creating Profile in Docker Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Register & Launch Workspace</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer security tag */}
            <div className={`pt-2 border-t flex items-center justify-between text-[10px] text-slate-500 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
              <span className="flex items-center gap-1">
                <Shield className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span>Zero-Trust Role-Based Marine Access</span>
              </span>
              <span>v2.4 Production Docker Build</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
