import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { Heart, ArrowLeft, Loader2, Users, Store, Mail, Lock, Phone } from 'lucide-react';

export default function Auth({ onLogin }) {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('user');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        restaurantName: ''
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const isDemo = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'YOUR_API_KEY' || import.meta.env.VITE_FIREBASE_API_KEY === 'mock-api-key';
            let user;

            if (isDemo) {
                console.log('⚠️ Running in DEMO MODE (Mock Auth)');
                await new Promise(r => setTimeout(r, 600));
                const demoName = role === 'restaurant'
                    ? (formData.restaurantName || formData.name || 'Marble Cafe')
                    : (formData.name || 'Sarah Doe');
                user = {
                    uid: `demo-${role}-${Date.now()}`,
                    email: formData.email,
                    displayName: demoName
                };
            } else {
                let userCredential;
                if (isLogin) {
                    userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                } else {
                    userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                    if (formData.name) {
                        await updateProfile(userCredential.user, { displayName: formData.name });
                    }
                }
                user = userCredential.user;
            }

            // Sync with backend (non-blocking)
            try {
                await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: user.uid,
                        name: user.displayName || 'User',
                        email: user.email,
                        phone: formData.phone || '',
                        role: role
                    })
                });
            } catch (syncErr) {
                console.warn('Backend sync failed, proceeding with local login:', syncErr);
            }

            const resolvedName = role === 'restaurant'
                ? (formData.restaurantName || user.displayName || 'Restaurant')
                : (user.displayName || 'User');

            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: resolvedName,
                restaurantName: role === 'restaurant' ? resolvedName : undefined
            };

            localStorage.setItem('userRole', role);
            localStorage.setItem('mockUser', JSON.stringify(userData));

            // Update App state directly — triggers immediate re-render & redirect
            if (onLogin) {
                onLogin(userData, role);
            }

            navigate(role === 'restaurant' ? '/dashboard' : '/map');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already in use.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Invalid email or password.');
            } else {
                setError('Authentication failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen marble-bg flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-sage-50 rounded-full blur-3xl opacity-50"></div>

            <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-[#8c7e6a] hover:text-[#1a1816] font-bold text-sm transition-all group z-10">
                <div className="bg-white p-2 rounded-xl shadow-marble group-hover:shadow-marble-lg transition-all">
                    <ArrowLeft size={16} />
                </div>
                Return Home
            </Link>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up">
                <div className="flex justify-center mb-6">
                    <div className="bg-[#1a1816] p-3 rounded-2xl shadow-xl">
                        <Heart className="h-8 w-8 text-white fill-white" />
                    </div>
                </div>
                <h2 className="text-center text-4xl font-black text-[#1a1816] tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="mt-3 text-center text-[#6b6256] font-medium">
                    {isLogin ? "Sign in to pick up where you left off." : "Join the movement and start saving food today."}
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="marble-card p-10 bg-white">
                    {/* Role Picker */}
                    <div className="flex bg-[#f9f4ea] rounded-2xl p-1 mb-8 border border-[#efeadc]">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === 'user' ? 'bg-white text-[#1a1816] shadow-sm' : 'text-[#8c7e6a] hover:text-[#1a1816]'}`}
                            onClick={() => setRole('user')}
                            type="button"
                        >
                            <Users size={18} />
                            User / NGO
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === 'restaurant' ? 'bg-white text-[#1a1816] shadow-sm' : 'text-[#8c7e6a] hover:text-[#1a1816]'}`}
                            onClick={() => setRole('restaurant')}
                            type="button"
                        >
                            <Store size={18} />
                            Restaurant
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Restaurant name field — shown during BOTH sign-up and sign-in when role is restaurant */}
                        {(role === 'restaurant') && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">
                                    Restaurant Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8c7e6a]">
                                        <Store size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] pl-11 pr-4 py-4 text-sm text-[#2d2a26] font-medium focus:ring-4 focus:ring-emerald-50"
                                        value={formData.restaurantName}
                                        onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                                        placeholder="e.g. Pasta Palace"
                                    />
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="grid grid-cols-1 gap-6 animate-fade-in">
                                {role !== 'restaurant' && (
                                    <div>
                                        <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] px-4 py-4 text-sm text-[#2d2a26] font-medium focus:ring-4 focus:ring-emerald-50"
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8c7e6a]">
                                            <Phone size={16} />
                                        </div>
                                        <input
                                            type="tel"
                                            required
                                            className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] pl-11 pr-4 py-4 text-sm text-[#2d2a26] font-medium focus:ring-4 focus:ring-emerald-50"
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8c7e6a]">
                                    <Mail size={16} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] pl-11 pr-4 py-4 text-sm text-[#2d2a26] font-medium focus:ring-4 focus:ring-emerald-50"
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8c7e6a]">
                                    <Lock size={16} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] pl-11 pr-4 py-4 text-sm text-[#2d2a26] font-medium focus:ring-4 focus:ring-emerald-50"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-3 py-5 px-4 rounded-2xl bg-[#1a1816] text-white text-sm font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-[#f3f0e8]">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-xs font-bold text-[#8c7e6a] hover:text-emerald-700 transition"
                        >
                            {isLogin ? "DON'T HAVE AN ACCOUNT? SIGN UP" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
