import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, ShieldCheck, Globe, Zap, AlertTriangle } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#f5f0e8] text-black font-['Inter',sans-serif] selection:bg-[#ff5722] selection:text-black">
            {/* Nav */}
            <header className="px-6 py-4 flex justify-between items-center bg-[#1a1a1a] border-b-[4px] border-[#ff5722] sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="bg-[#ff5722] p-2 border-[3px] border-black shadow-[4px_4px_0px_#000]">
                        <Zap className="text-black" size={24} strokeWidth={3} />
                    </div>
                    <span className="text-2xl font-black tracking-[-0.05em] text-white uppercase">FOOD // RESCUE</span>
                </div>
                <Link
                    to="/auth"
                    className="brutal-btn bg-[#ff5722] hover:bg-[#e64a19] text-black px-6 py-2.5 text-sm"
                >
                    SIGN IN <ArrowRight size={16} className="inline ml-1" />
                </Link>
            </header>

            {/* Hero Section */}
            <main className="px-6 pt-20 pb-20 max-w-[1400px] mx-auto">
                <div className="flex flex-col items-start animate-brutal-up">
                    <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1 border-[3px] border-black shadow-[4px_4px_0px_#ff5722] text-xs font-black tracking-[0.2em] uppercase mb-8">
                        <AlertTriangle size={14} className="text-[#ff5722]" />
                        SYSTEM ACTIVE
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-black leading-[0.9] mb-8 tracking-tighter uppercase">
                        STOP <span className="text-[#ff5722] mix-blend-multiply">WASTING</span> <br />
                        START SAVING.
                    </h1>

                    <p className="text-xl md:text-2xl text-black font-bold mb-12 max-w-3xl leading-snug border-l-[6px] border-[#ff5722] pl-6 py-2 bg-white/50">
                        SURPLUS FOOD IS NOT TRASH. CONNECT DIRECTLY WITH RESTAURANTS TO RESCUE FRESH MEALS BEFORE THEY HIT THE LANDFILL.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                        <Link
                            to="/auth"
                            className="brutal-btn bg-[#ff5722] text-black text-xl py-4 px-10 flex items-center gap-3 w-full sm:w-auto justify-center"
                        >
                            INITIATE RESCUE
                            <ArrowRight size={24} strokeWidth={3} />
                        </Link>
                        <div className="brutal-card bg-white px-6 py-3 flex items-center gap-4">
                            <span className="font-black text-3xl">500+</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#666] leading-tight">
                                ACTIVE<br />RESCUERS
                            </span>
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 animate-brutal-up" style={{ animationDelay: '0.1s' }}>
                    <div className="brutal-card bg-white p-8 group">
                        <div className="w-16 h-16 bg-[#ff5722] border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <MapPin size={32} strokeWidth={2.5} className="text-black" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">LIVE RADAR</h3>
                        <p className="text-black font-bold text-sm uppercase tracking-wider leading-relaxed opacity-80">
                            REAL-TIME TRACKING OF SURPLUS FOOD IN YOUR IMMEDIATE VICINITY. NO DELAYS.
                        </p>
                    </div>

                    <div className="brutal-card bg-[#1a1a1a] text-white p-8 group">
                        <div className="w-16 h-16 bg-[#00e676] border-[3px] border-black shadow-[4px_4px_0px_#ff5722] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={32} strokeWidth={2.5} className="text-black" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">VERIFIED NODES</h3>
                        <p className="text-white font-bold text-sm uppercase tracking-wider leading-relaxed opacity-80">
                            STRICT VETTING PROCESS FOR ALL PARTNERING ESTABLISHMENTS. SAFETY GUARANTEED.
                        </p>
                    </div>

                    <div className="brutal-card bg-white p-8 group">
                        <div className="w-16 h-16 bg-[#ff5722] border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                            <Globe size={32} strokeWidth={2.5} className="text-black" />
                        </div>
                        <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">GLOBAL IMPACT</h3>
                        <p className="text-black font-bold text-sm uppercase tracking-wider leading-relaxed opacity-80">
                            MINIMIZE CARBON EMISSIONS BY INTERCEPTING FOOD WASTE AT THE SOURCE.
                        </p>
                    </div>
                </div>

                {/* How it Works */}
                <div className="mt-32 brutal-card bg-[#ff5722] p-12 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter mb-16">
                            PROTOCOL
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="border-[3px] border-black bg-white p-6 shadow-[6px_6px_0px_#000]">
                                <div className="text-6xl font-black text-black opacity-20 absolute -mt-10 -ml-2">01</div>
                                <h4 className="font-black text-xl mb-4 mt-4 uppercase">AUTHENTICATE</h4>
                                <p className="text-sm font-bold uppercase tracking-wider opacity-80">Register as a supplier or rescuer within the system.</p>
                            </div>
                            <div className="border-[3px] border-black bg-white p-6 shadow-[6px_6px_0px_#000]">
                                <div className="text-6xl font-black text-black opacity-20 absolute -mt-10 -ml-2">02</div>
                                <h4 className="font-black text-xl mb-4 mt-4 uppercase">LOCATE</h4>
                                <p className="text-sm font-bold uppercase tracking-wider opacity-80">Scan the live map for available drops nearby.</p>
                            </div>
                            <div className="border-[3px] border-black bg-[#1a1a1a] text-white p-6 shadow-[6px_6px_0px_#000]">
                                <div className="text-6xl font-black text-[#ff5722] opacity-40 absolute -mt-10 -ml-2">03</div>
                                <h4 className="font-black text-xl mb-4 mt-4 uppercase text-[#ff5722]">EXECUTE</h4>
                                <p className="text-sm font-bold uppercase tracking-wider opacity-80">Claim and extract the surplus before the deadline.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-black border-t-[4px] border-[#ff5722] py-12 px-6 mt-20">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Zap className="text-[#ff5722]" size={24} strokeWidth={3} />
                        <span className="text-xl font-black text-white uppercase tracking-widest">FOOD // RESCUE</span>
                    </div>
                    <p className="text-xs text-white font-mono uppercase tracking-[0.2em]">
                        © 2026 // ZERO WASTE PROTOCOL
                    </p>
                </div>
            </footer>
        </div>
    );
}
