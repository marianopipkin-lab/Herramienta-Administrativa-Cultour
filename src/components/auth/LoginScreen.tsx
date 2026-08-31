import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Compass,
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface Props {
  onBypassLogin?: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onBypassLogin }) => {
  const { setCurrentRole, setUserProfile } = useApp();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('socio');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isConfigured) {
      setErrorMsg('Supabase no está conectado todavía. Por favor configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en su archivo de variables de entorno.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Por favor complete todos los campos obligatorios.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
              role: role
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Upsert to user_profiles
          await supabase.from('user_profiles').upsert({
            id: data.user.id,
            email: data.user.email || email,
            full_name: fullName || email.split('@')[0],
            role: role
          });

          setCurrentRole(role);
          if (setUserProfile) {
            setUserProfile({
              id: data.user.id,
              email: data.user.email || email,
              fullName: fullName || email.split('@')[0],
              role: role
            });
          }

          if (data.session) {
            setSuccessMsg('¡Cuenta creada e iniciada exitosamente!');
          } else {
            setSuccessMsg('¡Cuenta registrada! Si tienes confirmación de email activada en Supabase, revisa tu casilla.');
          }
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const userRole = (profile?.role as UserRole) || (data.user.user_metadata?.role as UserRole) || 'socio';
          const name = profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0];

          setCurrentRole(userRole);
          if (setUserProfile) {
            setUserProfile({
              id: data.user.id,
              email: data.user.email || email,
              fullName: name,
              role: userRole
            });
          }
          setSuccessMsg('¡Inicio de sesión exitoso!');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Error durante la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole: UserRole) => {
    setCurrentRole(demoRole);
    if (setUserProfile) {
      setUserProfile({
        id: 'demo-user-' + demoRole,
        email: `demo.${demoRole}@cultour.com`,
        fullName: demoRole === 'socio' ? 'Mariano Pipkin (Socio)' : demoRole === 'administrativo' ? 'Administración Cultour' : 'Coordinador Operativo',
        role: demoRole
      });
    }
    if (onBypassLogin) {
      onBypassLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] bg-grid-dots text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow ambient backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-xl shadow-indigo-950 border border-indigo-400/30">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase font-syne">
            CULTOUR GESTIÓN
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Sistema Integral de Operaciones & Tesorería SGOF
          </p>
        </div>

        {/* Supabase Status Pill */}
        <div className="mt-4 flex justify-center">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              isConfigured
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-amber-950/60 border-amber-700 text-amber-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>
              {isConfigured ? 'Conectado a Supabase' : 'Supabase no configurado (Modo Local Activo)'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#18181b] border border-[#27272a] py-8 px-6 shadow-2xl rounded-2xl sm:px-8 space-y-6">
          {/* Sign In vs Sign Up Tabs */}
          <div className="flex border-b border-[#27272a] text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 pb-3 text-center transition-colors border-b-2 ${
                !isSignUp
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 pb-3 text-center transition-colors border-b-2 ${
                isSignUp
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMsg}</p>
                {!isConfigured && (
                  <p className="text-[11px] text-rose-300/80 mt-1">
                    Recuerda definir <code className="bg-black/40 px-1 py-0.5 rounded text-white">VITE_SUPABASE_URL</code> y <code className="bg-black/40 px-1 py-0.5 rounded text-white">VITE_SUPABASE_ANON_KEY</code>.
                  </p>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required={isSignUp}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Ej: Mariano Pipkin"
                      className="w-full bg-[#111113] border border-[#27272a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono">
                    Rol en la Empresa
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as UserRole)}
                      className="w-full bg-[#111113] border border-[#27272a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="socio">Socio (Acceso Total & Finanzas)</option>
                      <option value="administrativo">Administrativo (Cobranzas & Pagos)</option>
                      <option value="operativo">Operativo (Files & Logística)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@cultour.com"
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-mono">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950 transition-all cursor-pointer font-mono uppercase tracking-wider"
            >
              {loading ? (
                <span>Procesando...</span>
              ) : isSignUp ? (
                <>
                  <span>Registrar Usuario</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Iniciar Sesión con Supabase</span>
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Mode */}
          <div className="pt-4 border-t border-[#27272a] space-y-3">
            <div className="text-center">
              <span className="text-[11px] text-zinc-400 font-mono">
                ¿Acceso rápido para demostración o desarrollo?
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('socio')}
                className="p-2 rounded-lg bg-[#202024] hover:bg-indigo-950/50 border border-zinc-700 hover:border-indigo-600 text-xs font-semibold text-zinc-200 hover:text-indigo-300 transition-all flex flex-col items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px]">Rol Socio</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('administrativo')}
                className="p-2 rounded-lg bg-[#202024] hover:bg-emerald-950/50 border border-zinc-700 hover:border-emerald-600 text-xs font-semibold text-zinc-200 hover:text-emerald-300 transition-all flex flex-col items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px]">Rol Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('operativo')}
                className="p-2 rounded-lg bg-[#202024] hover:bg-amber-950/50 border border-zinc-700 hover:border-amber-600 text-xs font-semibold text-zinc-200 hover:text-amber-300 transition-all flex flex-col items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">Rol Operativo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
