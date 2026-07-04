import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { ArrowLeft, Loader2, Users, Store, Zap, Terminal } from 'lucide-react';

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

    // Clear form when switching between Login / Signup or changing Roles
    useEffect(() => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            restaurantName: ''
        });
        setError(null);
    }, [isLogin, role]);

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
                
                // Bug fix: Reuse same ID for logins in demo mode so dashboard postings persist
                const demoId = isLogin 
                    ? `demo-${role}` 
                    : `demo-${role}-${Date.now()}`;
                    
                const demoName = role === 'restaurant'
                    ? (formData.restaurantName || formData.name || 'Demo Restaurant')
                    : (formData.name || 'Demo User');
                    
                user = {
                    uid: demoId,
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

            // Update App state directly
            if (onLogin) {
                onLogin(userData, role);
            }

            navigate(role === 'restaurant' ? '/dashboard' : '/map');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('EMAIL ALREADY IN USE.');
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('INVALID CREDENTIALS.');
            } else {
                setError('AUTHENTICATION FAILED.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f0e8] text-black font-['Inter',sans-serif] flex flex-col justify-center py-12 px-6 relative selection:bg-[#ff5722] selection:text-black">
            
            <Link to="/" className="absolute top-8 left-8 brutal-btn bg-white px-4 py-2 flex items-center gap-2 text-xs">
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">ABORT</span>
            </Link>

            <div className="w-full max-w-md mx-auto animate-brutal-up">
                
                {/* Header */}
                <div className="bg-[#1a1a1a] text-white p-6 border-[3px] border-black shadow-[6px_6px_0px_#ff5722] mb-8 flex items-center gap-4">
                    <div className="bg-[#ff5722] p-3 border-[3px] border-black shadow-[4px_4px_0px_#000]">
                        <Terminal className="text-black" size={24} strokeWidth={3} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight leading-none">
                            {isLogin ? 'SYSTEM LOGIN' : 'INITIALIZE'}
                        </h2>
                        <p className="text-[10px] text-[#888] font-mono uppercase tracking-[0.2em] mt-1">
                            {isLogin ? "Authenticate identity" : "Register new node"}
                        </p>
                    </div>
                </div>

                <div className="brutal-card bg-white p-8">
                    {/* Role Picker */}
                    <div className="flex border-[3px] border-black shadow-[4px_4px_0px_#000] mb-8 bg-[#f5f0e8]">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all ${role === 'user' ? 'bg-[#ff5722] text-black border-r-[3px] border-black' : 'text-[#666] hover:text-black hover:bg-white border-r-[3px] border-black'}`}
                            onClick={() => setRole('user')}
                            type="button"
                        >
                            <Users size={16} />
                            RESCUER
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all ${role === 'restaurant' ? 'bg-[#ff5722] text-black' : 'text-[#666] hover:text-black hover:bg-white'}`}
                            onClick={() => setRole('restaurant')}
                            type="button"
                        >
                            <Store size={16} />
                            SUPPLIER
                        </button>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        
                        {(!isLogin && role === 'restaurant') && (
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-1">
                                    ESTABLISHMENT NAME
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="brutal-input w-full p-4 text-sm"
                                    value={formData.restaurantName}
                                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                                    placeholder="ENTER NAME..."
                                />
                            </div>
                        )}

                        {!isLogin && (
                            <>
                                {role !== 'restaurant' && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1">
                                            OPERATOR NAME
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="brutal-input w-full p-4 text-sm"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="ENTER DESIGNATION..."
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1">
                                        COMMLINK (PHONE)
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        className="brutal-input w-full p-4 text-sm"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="ENTER NUMBER..."
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1">
                                EMAIL IDENTIFIER
                            </label>
                            <input
                                type="email"
                                required
                                className="brutal-input w-full p-4 text-sm"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="ENTER EMAIL..."
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1">
                                ACCESS CODE (PASSWORD)
                            </label>
                            <input
                                type="password"
                                required
                                className="brutal-input w-full p-4 text-sm"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-black text-[#ff5722] text-[10px] font-black uppercase tracking-widest p-3 border-[3px] border-[#ff5722] shadow-[4px_4px_0px_#ff5722] flex items-center justify-center">
                                ERR: {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="brutal-btn w-full flex justify-center items-center gap-3 py-4 mt-4 bg-[#ff5722] text-black text-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'EXECUTE LOGIN' : 'EXECUTE REGISTRATION'}
                                    <Zap size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Toggle */}
                <div className="mt-8 text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a] hover:text-[#ff5722] hover:bg-black px-4 py-2 border-[2px] border-transparent hover:border-black transition-all"
                    >
                        {isLogin ? "NO ACCESS? INITIALIZE NEW NODE →" : "HAVE ACCESS? RETURN TO LOGIN →"}
                    </button>
                </div>
            </div>
        </div>
    );
}
