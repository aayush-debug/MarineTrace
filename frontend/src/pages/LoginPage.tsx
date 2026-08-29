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
    <div className="relative min-h-screen w-screen bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-x-hidden font-sans selection:bg-sky-500 selection:text-white transition-colors duration-200">
      {/* Top Right Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white text-xs font-medium backdrop-blur-md transition-all shadow-md cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[11px] font-semibold">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Background Grid & Radar Sweep Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient Ocean Gradient Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-sky-200/40 dark:bg-cyan-900/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[700px] h-[700px] bg-blue-200/40 dark:bg-blue-900/15 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-100/50 dark:bg-sky-950/20 rounded-full blur-[180px]" />

        {/* Tactical Radar Concentric Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-sky-500/10 dark:border-cyan-500/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] border border-sky-500/15 dark:border-cyan-500/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-sky-500/20 dark:border-cyan-500/15 rounded-full" />

        {/* Fine coordinate matrix grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/80 border border-slate-300/80 dark:border-slate-800 backdrop-blur-md shadow-sm text-xs font-mono text-sky-700 dark:text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>OPERATIONAL MARITIME SURVEILLANCE SUITE</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 dark:from-cyan-500 dark:to-sky-600 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-white dark:bg-[#080d1a] rounded-[10px] flex items-center justify-center">
                <Compass className="w-6 h-6 text-sky-600 dark:text-cyan-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              MarineTrace
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Sentinel-1 SAR Detection • OpenDrift Trajectory Backtracking • AIS Vessel Attribution
          </p>
        </div>

        {/* Main Card Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Quick 1-Click Demo Operator Logins */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-[#090e1a]/85 border border-slate-200/90 dark:border-slate-800/80 backdrop-blur-xl shadow-xl dark:shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-cyan-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Instant Operator Access</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Coast Guard Officer Access
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
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
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50/90 hover:bg-sky-50/70 dark:bg-slate-900/60 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800/90 hover:border-sky-500/50 dark:hover:border-cyan-500/50 transition-all text-left group cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center group-hover:bg-sky-100/80 dark:group-hover:bg-cyan-500/10 group-hover:border-sky-300 dark:group-hover:border-cyan-500/30 transition-all shrink-0">
                        <Icon className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-sky-600 dark:group-hover:text-cyan-300 transition-colors">
                            {role.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate block">
                          {role.role}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-500 truncate block">
                          {role.agency}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 pl-2">
                      <span className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold hidden sm:inline">
                        Sign In
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 dark:text-slate-600 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Docker Backend Live Telemetry Card */}
            <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-[#060a14] border border-slate-200 dark:border-cyan-500/20 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 font-semibold text-[11px] ${backendOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-700 dark:text-cyan-300'}`}>
                  <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500 dark:bg-cyan-400'}`} />
                  {backendOnline ? 'Docker Container Connected' : 'Standalone Simulation Mode'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${backendOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30' : 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30'}`}>
                  {backendOnline ? (dockerTelemetry?.is_dockerized ? 'Docker Engine' : 'FastAPI Live') : 'Client Ready'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Server className="w-3 h-3 text-sky-600 dark:text-cyan-400 shrink-0" />
                  <span className="truncate">
                    ID: {dockerTelemetry?.container_id || 'marinetrace-backend'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>SQLite Persisted</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Custom Login & Registration Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white/95 dark:bg-[#090e1a]/95 border border-slate-200/90 dark:border-slate-800 backdrop-blur-xl shadow-xl dark:shadow-2xl flex flex-col justify-between space-y-5">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 p-1 bg-slate-100/90 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearAuthError();
                  }}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-sky-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
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
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-sky-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Register Account
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-1">
                <Radar className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-500" />
                <span>SECURE CHANNEL</span>
              </div>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-500/40 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="block font-semibold text-rose-900 dark:text-rose-300 mb-0.5">Authentication Alert</strong>
                  <p className="text-[11px] leading-relaxed">{authError}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                    <span>Email Address or Username</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="commander@marinetrace.org"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-sky-500 dark:focus:ring-cyan-400 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all font-mono outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                      <span>Security Password</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Default: <code className="text-sky-700 dark:text-cyan-400 font-bold">admin</code>)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-sky-500 dark:focus:ring-cyan-400 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all font-mono outline-none pr-10 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sky-600 dark:text-cyan-500 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span className="text-[11px]">Remember operator session</span>
                  </label>
                  <span className="text-[11px] font-medium text-sky-700 dark:text-cyan-400/80">Docker Synchronized</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white dark:from-cyan-500 dark:to-sky-600 dark:hover:from-cyan-400 dark:hover:to-sky-500 dark:text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-950" />
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
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Lt. David Sterling"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-cyan-400 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="david@coastguard.gov"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-cyan-400 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Username</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="dsterling"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-cyan-400 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none font-mono shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-cyan-400 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Operator Role</label>
                    <input
                      type="text"
                      required
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      placeholder="Maritime Intelligence Officer"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-cyan-400 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                      <span>Agency / Command</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regAgency}
                      onChange={(e) => setRegAgency(e.target.value)}
                      placeholder="National Maritime Center"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 focus:border-sky-500 dark:focus:border-cyan-400 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
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
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
