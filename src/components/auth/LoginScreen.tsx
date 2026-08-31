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
    <div className="min-h-screen bg-[#F4F4F0] text-[#1A1A1A] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1A1A1A] shadow-lg border border-[#E5E5E1]">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-normal tracking-tight text-[#1A1A1A] uppercase">
            Cultour Gestión
          </h1>
          <p className="text-xs text-[#666666] font-mono">
            Sistema Integral de Operaciones & Tesorería SGOF
          </p>
        </div>

        {/* Supabase Status Pill */}
        <div className="mt-4 flex justify-center">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold font-mono border ${
              isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
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
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] py-8 px-6 shadow-sm rounded-2xl sm:px-8 space-y-6">
          {/* Sign In vs Sign Up Tabs */}
          <div className="flex border-b border-[#E5E5E1] text-xs font-bold font-mono">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 pb-3 text-center transition-colors border-b-2 cursor-pointer ${
                !isSignUp
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#888888] hover:text-[#1A1A1A]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 pb-3 text-center transition-colors border-b-2 cursor-pointer ${
                isSignUp
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#888888] hover:text-[#1A1A1A]'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMsg}</p>
                {!isConfigured && (
                  <p className="text-[11px] text-rose-600/80 mt-1">
                    Recuerda definir <code className="bg-rose-100 px-1 py-0.5 rounded text-rose-900">VITE_SUPABASE_URL</code> y <code className="bg-rose-100 px-1 py-0.5 rounded text-rose-900">VITE_SUPABASE_ANON_KEY</code>.
                  </p>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#666666] mb-1.5 font-mono uppercase">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required={isSignUp}
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Ej: Mariano Pipkin"
                      className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1A1A1A] placeholder-[#888888] focus:border-[#4F46E5] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#666666] mb-1.5 font-mono uppercase">
                    Rol en la Empresa
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as UserRole)}
                      className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1A1A1A] focus:border-[#4F46E5] focus:outline-none cursor-pointer"
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
              <label className="block text-xs font-bold text-[#666666] mb-1.5 font-mono uppercase">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@cultour.com"
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#1A1A1A] placeholder-[#888888] focus:border-[#4F46E5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#666666] mb-1.5 font-mono uppercase">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-xl pl-9 pr-10 py-2.5 text-xs text-[#1A1A1A] placeholder-[#888888] focus:border-[#4F46E5] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#1A1A1A] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-black disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer font-mono uppercase tracking-wider"
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
          <div className="pt-4 border-t border-[#E5E5E1] space-y-3">
            <div className="text-center">
              <span className="text-[11px] text-[#888888] font-mono">
                ¿Acceso rápido para demostración o desarrollo?
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('socio')}
                className="p-2.5 rounded-xl bg-[#F9F9F7] hover:bg-[#F4F4F0] border border-[#E5E5E1] text-xs font-semibold text-[#1A1A1A] transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span className="text-[10px] font-mono">Rol Socio</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('administrativo')}
                className="p-2.5 rounded-xl bg-[#F9F9F7] hover:bg-[#F4F4F0] border border-[#E5E5E1] text-xs font-semibold text-[#1A1A1A] transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#059669]" />
                <span className="text-[10px] font-mono">Rol Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('operativo')}
                className="p-2.5 rounded-xl bg-[#F9F9F7] hover:bg-[#F4F4F0] border border-[#E5E5E1] text-xs font-semibold text-[#1A1A1A] transition-all flex flex-col items-center gap-1 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-[#D97706]" />
                <span className="text-[10px] font-mono">Rol Operativo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
