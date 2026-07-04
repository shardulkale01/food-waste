import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { MapPin, LogOut, Loader2, CheckSquare, Zap, Clock, Terminal, Activity } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const restaurantIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Click handler to let restaurant pick location on map
function ClickHandler({ onLocationChange }) {
    useMapEvents({
        click(e) {
            onLocationChange(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

export default function RestaurantDashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [restaurantLoc, setRestaurantLoc] = useState([19.0760, 72.8777]);
    const [locSource, setLocSource] = useState('default');
    const [myPostings, setMyPostings] = useState([]);

    const [formData, setFormData] = useState({
        foodName: '',
        quantity: '',
        price: '',
        description: '',
        pickupTime: '',
        contactNumber: ''
    });

    const handleLogout = async () => {
        // Navigate first, then clear state to avoid route guard redirecting to /auth
        navigate('/');
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Sign out from Firebase failed:', err);
        }
        if (onLogout) {
            onLogout();
        }
    };

    // Fetch my postings
    const fetchMyPostings = async () => {
        if (!user?.uid) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/foods/my-postings/${user.uid}`);
            if (res.ok) {
                const data = await res.json();
                setMyPostings(data);
            }
        } catch (err) {
            console.error('Failed to fetch postings:', err);
        }
    };

    // Detect restaurant location and fetch postings on mount
    useEffect(() => {
        fetchMyPostings();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setRestaurantLoc([position.coords.latitude, position.coords.longitude]);
                    setLocSource('gps');
                },
                () => {
                    setLocSource('default');
                }
            );
        }
    }, []);

    const postFood = async (latitude, longitude) => {
        const payload = {
            ...formData,
            latitude,
            longitude,
            restaurantId: user.uid,
            restaurantName: user.restaurantName || user.displayName || 'Supplier',
            price: Number(formData.price)
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/add-food`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to execute posting protocol');

            setSuccess(true);
            setFormData({
                foodName: '',
                quantity: '',
                price: '',
                description: '',
                pickupTime: '',
                contactNumber: ''
            });

            // Auto-hide success message after 5 seconds
            setTimeout(() => setSuccess(false), 5000);
            fetchMyPostings(); // Refresh list
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        postFood(restaurantLoc[0], restaurantLoc[1]);
    };

    return (
        <div className="min-h-screen bg-[#f5f0e8] text-black font-['Inter',sans-serif] selection:bg-[#ff5722] selection:text-black">
            {/* ─── BRUTALIST NAV ─── */}
            <nav className="bg-[#1a1a1a] border-b-[4px] border-[#ff5722] px-6 py-4 flex justify-between items-center sticky top-0 z-[1000]">
                <div className="flex items-center gap-4">
                    <div className="bg-[#ff5722] p-2.5 border-[3px] border-black shadow-[4px_4px_0px_#000]">
                        <Terminal className="text-black" size={20} strokeWidth={3} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-[-0.05em] text-white uppercase">
                            SUPPLIER COMMAND
                        </h1>
                        <p className="text-[10px] font-black text-[#ff5722] uppercase tracking-[0.3em] leading-none mt-0.5">
                            {user.restaurantName || user.displayName || 'UNKNOWN NODE'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="brutal-btn flex items-center gap-2 bg-transparent hover:bg-red-600 border-[3px] border-[#555] hover:border-red-600 text-[#888] hover:text-white px-4 py-2 text-xs"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">TERMINATE LINK</span>
                </button>
            </nav>

            <main className="max-w-[1400px] mx-auto py-12 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Form */}
                    <div className="lg:col-span-7 animate-brutal-up">
                        <div className="brutal-card bg-white p-8">
                            
                            <div className="mb-8 border-b-[4px] border-black pb-6">
                                <h2 className="text-4xl font-black text-black tracking-tighter uppercase">TRANSMIT SURPLUS</h2>
                                <p className="text-[#ff5722] font-bold text-sm uppercase tracking-widest mt-1">Initiate food rescue broadcast to network.</p>
                            </div>

                            {success && (
                                <div className="mb-8 p-4 bg-black border-[3px] border-[#00e676] shadow-[4px_4px_0px_#00e676] flex items-center gap-3 text-white animate-brutal-fade">
                                    <div className="bg-[#00e676] p-1 border-[2px] border-black">
                                        <CheckSquare size={16} className="text-black" strokeWidth={3} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-[#00e676]">BROADCAST SUCCESSFUL!</span>
                                </div>
                            )}

                            {error && (
                                <div className="mb-8 p-4 bg-black border-[3px] border-[#ff5722] shadow-[4px_4px_0px_#ff5722] flex items-center gap-3 text-white animate-brutal-fade">
                                    <span className="text-xs font-black uppercase tracking-widest text-[#ff5722]">ERR: {error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1">FOOD IDENTIFIER</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.foodName}
                                            onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                                            className="brutal-input w-full p-4 text-sm"
                                            placeholder="ENTER DESIGNATION..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1">VOLUME / QTY</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            className="brutal-input w-full p-4 text-sm"
                                            placeholder="e.g. 10 BOXES"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1">VALUE (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="brutal-input w-full p-4 text-sm"
                                            placeholder="0 FOR FREE"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1">DEADLINE (TIME)</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.pickupTime}
                                            onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                                            className="brutal-input w-full p-4 text-sm font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-1">COMMLINK</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.contactNumber}
                                            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                            className="brutal-input w-full p-4 text-sm"
                                            placeholder="PHONE/WHATSAPP"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1">SUPPLEMENTAL DATA</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="brutal-input w-full p-4 text-sm"
                                        placeholder="DIETARY SPECS / INSTRUCTIONS..."
                                    ></textarea>
                                </div>

                                <div className="pt-4 border-t-[4px] border-black">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="brutal-btn w-full flex justify-center items-center gap-3 py-5 bg-[#ff5722] text-black text-sm disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                                        ) : (
                                            <>
                                                <Zap size={20} strokeWidth={3} />
                                                EXECUTE BROADCAST
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Location */}
                    <div className="lg:col-span-5 animate-brutal-up" style={{ animationDelay: '0.15s' }}>
                        <div className="brutal-card bg-black p-6">
                            
                            <div className="flex items-center gap-3 mb-6 bg-[#ff5722] p-3 border-[3px] border-white shadow-[4px_4px_0px_#fff]">
                                <MapPin size={24} className="text-black" strokeWidth={3} />
                                <div>
                                    <h3 className="text-xl font-black text-black uppercase tracking-tighter leading-none">
                                        NODE LOCATION
                                    </h3>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] p-4 border-[3px] border-white mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 border-[2px] border-black shadow-[2px_2px_0px_#000] ${locSource === 'gps' ? 'bg-[#00e676] animate-pulse' : 'bg-[#ff5722]'}`}></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                            {locSource === 'gps' ? 'GPS LOCKED' : 'MANUAL OVERRIDE'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[#888] uppercase mb-1">LATITUDE</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={restaurantLoc[0]}
                                            onChange={(e) => {
                                                const lat = parseFloat(e.target.value) || 0;
                                                setRestaurantLoc([lat, restaurantLoc[1]]);
                                                setLocSource('manual');
                                            }}
                                            className="w-full bg-black text-[#00e676] border-[2px] border-[#333] font-mono p-2 text-xs font-bold focus:border-[#ff5722] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[#888] uppercase mb-1">LONGITUDE</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={restaurantLoc[1]}
                                            onChange={(e) => {
                                                const lng = parseFloat(e.target.value) || 0;
                                                setRestaurantLoc([restaurantLoc[0], lng]);
                                                setLocSource('manual');
                                            }}
                                            className="w-full bg-black text-[#00e676] border-[2px] border-[#333] font-mono p-2 text-xs font-bold focus:border-[#ff5722] outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Map Container */}
                            <div className="border-[3px] border-white shadow-[6px_6px_0px_#fff]" style={{ height: '320px' }}>
                                <MapContainer
                                    center={restaurantLoc}
                                    zoom={14}
                                    scrollWheelZoom={true}
                                    className="h-full w-full brutal-map"
                                    key={restaurantLoc.join(',')}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={restaurantLoc} icon={restaurantIcon}>
                                        <Popup className="brutal-popup">
                                            <div className="font-black text-sm uppercase p-1">SUPPLY ORIGIN</div>
                                        </Popup>
                                    </Marker>
                                    <ClickHandler onLocationChange={(lat, lng) => {
                                        setRestaurantLoc([lat, lng]);
                                        setLocSource('manual');
                                    }} />
                                </MapContainer>
                            </div>
                            <p className="text-[10px] text-[#888] mt-4 font-mono text-center uppercase tracking-[0.1em]">
                                CLICK MAP TO ADJUST COORDINATES
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: My Recent Postings */}
                <div className="mt-16 animate-brutal-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex justify-between items-end mb-6 border-b-[4px] border-black pb-2">
                        <h2 className="text-4xl font-black text-black tracking-tighter uppercase flex items-center gap-3">
                            <Activity size={32} strokeWidth={3} className="text-[#ff5722]" />
                            TRANSMISSION LOG
                        </h2>
                        <span className="bg-black text-white border-[3px] border-[#ff5722] shadow-[4px_4px_0px_#ff5722] text-[10px] font-black px-4 py-2 uppercase tracking-widest">
                            {myPostings.length} TOTAL
                        </span>
                    </div>

                    {myPostings.length === 0 ? (
                        <div className="brutal-card bg-white p-12 text-center">
                            <p className="text-black font-black text-xl uppercase tracking-widest">NO TRANSMISSIONS LOGGED</p>
                            <p className="text-[#ff5722] text-xs font-mono uppercase mt-2">Initialize broadcast to begin.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myPostings.slice().reverse().map((post) => (
                                <div key={post._id} className="brutal-card bg-white p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4 border-b-[2px] border-dashed border-[#ccc] pb-3">
                                            <h4 className="font-black text-black text-lg uppercase leading-tight truncate pr-2" title={post.foodName}>
                                                {post.foodName}
                                            </h4>
                                            <span className={`flex-shrink-0 text-[9px] font-black px-2 py-1 uppercase tracking-widest border-[2px] border-black shadow-[2px_2px_0px_#000] ${post.isClaimed ? 'bg-black text-white' : 'bg-[#00e676] text-black'}`}>
                                                {post.isClaimed ? 'CLAIMED' : 'LIVE'}
                                            </span>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <p className="text-xs text-black font-bold flex justify-between">
                                                <span className="text-[#888]">QTY:</span> 
                                                <span className="uppercase">{post.quantity}</span>
                                            </p>
                                            <p className="text-xs text-black font-bold flex justify-between">
                                                <span className="text-[#888]">VAL:</span> 
                                                <span>{post.price === 0 ? 'FREE' : `₹${post.price}`}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-3 border-t-[3px] border-black flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-[#888] flex items-center gap-1">
                                            <Clock size={12} strokeWidth={3} /> {post.pickupTime}
                                        </span>
                                        <span className="text-[9px] font-mono text-[#ccc]">ID:{post._id.slice(-5).toUpperCase()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
