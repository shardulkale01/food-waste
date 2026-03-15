import { Link } from 'react-router-dom';
import { MapPin, Heart, Clock, Utensils, ArrowRight, Sparkles, ShieldCheck, Globe } from 'lucide-react';

export default function Landing() {
    return (
        <div className="min-h-screen marble-bg text-[#2d2a26]">
            {/* Nav */}
            <header className="px-8 py-5 flex justify-between items-center bg-white/50 border-b border-[#f3f0e8] sticky top-0 z-50 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                    <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm">
                        <Heart className="text-white fill-white" size={20} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-[#1a1816]">Food Rescue Map</span>
                </div>
                <Link
                    to="/auth"
                    className="text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1.5 transition-all text-sm px-4 py-2 rounded-full border border-emerald-100 bg-emerald-50/50"
                >
                    Sign In <ArrowRight size={14} />
                </Link>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-6 pt-24 pb-20 max-w-6xl">
                <div className="text-center animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 bg-[#f9f4ea] text-[#8c7e6a] px-5 py-2 rounded-full text-xs font-bold tracking-wider uppercase mb-8 border border-[#efeadc]">
                        <Sparkles size={14} className="text-emerald-600" />
                        A Better Way to Share
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-[#1a1816] leading-[1.05] mb-8 tracking-tighter">
                        Find fresh food nearby<br />
                        <span className="text-emerald-600 italic font-serif">save money, </span>
                        save waste.
                    </h1>

                    <p className="text-lg md:text-xl text-[#6b6256] mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        Connecting restaurants with surplus fresh food to individuals
                        and NGOs on an elegant, real-time map.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                        <Link
                            to="/auth"
                            className="bg-[#1a1816] text-white text-lg font-bold py-4.5 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                        >
                            Get Started
                            <ArrowRight size={20} />
                        </Link>
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-[#f3f0e8] flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" />
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
                                +500
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="marble-card p-8">
                        <div className="w-14 h-14 bg-sage-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-50">
                            <MapPin size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[#1a1816]">Real-time Map</h3>
                        <p className="text-[#6b6256] leading-relaxed font-medium">
                            Live distance-calculated map helps you find the freshest options just blocks away.
                        </p>
                    </div>

                    <div className="marble-card p-8">
                        <div className="w-14 h-14 bg-sage-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-50">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[#1a1816]">Verified Listings</h3>
                        <p className="text-[#6b6256] leading-relaxed font-medium">
                            Every restaurant is manually verified to ensure food safety and quality standards.
                        </p>
                    </div>

                    <div className="marble-card p-8">
                        <div className="w-14 h-14 bg-sage-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-50">
                            <Globe size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[#1a1816]">Impact Driven</h3>
                        <p className="text-[#6b6256] leading-relaxed font-medium">
                            Join a global movement reducing carbon footprint by preventing landfill waste.
                        </p>
                    </div>
                </div>

                {/* How it Works - Warm Marble Style */}
                <div className="mt-32 p-12 bg-white border border-[#f3f0e8] rounded-[40px] shadow-marble overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 text-center mb-16">
                        <h2 className="text-3xl font-black text-[#1a1816]">Simple as 1-2-3</h2>
                        <div className="h-1 w-12 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        <div className="text-center group">
                            <div className="w-12 h-12 bg-[#1a1816] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-6 group-hover:scale-110 transition-transform">1</div>
                            <h4 className="font-bold text-[#1a1816] mb-2">Sign Up</h4>
                            <p className="text-sm text-[#6b6256]">Join as a Restaurant or a Rescuer in seconds.</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-12 h-12 bg-[#1a1816] text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-6 group-hover:scale-110 transition-transform">2</div>
                            <h4 className="font-bold text-[#1a1816] mb-2">Find & Connect</h4>
                            <p className="text-sm text-[#6b6256]">Explore the map and reach out via WhatsApp.</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-6 group-hover:scale-110 transition-transform">3</div>
                            <h4 className="font-bold text-[#1a1816] mb-2">Save Food</h4>
                            <p className="text-sm text-[#6b6256]">Pickup your meal and make a difference.</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-[#f3f0e8] py-16">
                <div className="container mx-auto px-6 max-w-6xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Heart className="text-emerald-600 fill-emerald-600" size={20} />
                        <span className="text-lg font-bold">Food Rescue Map</span>
                    </div>
                    <p className="text-sm text-[#8c7e6a] font-medium">
                        © 2026 Food Rescue Project · For a greener planet.
                    </p>
                </div>
            </footer>
        </div>
    );
}
