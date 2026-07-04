import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LogOut, Navigation, Phone, MessageCircle, AlertCircle, X, ChevronDown, MapPin, Clock, Zap } from 'lucide-react';

// Fix Leaflet marker icons issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const restaurantIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to dynamically update map center
function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0) map.setView(center, 14);
    }, [center, map]);
    return null;
}

// Haversine distance calculator
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d;
}

export default function UserMap({ user, onLogout }) {
    const navigate = useNavigate();
    const [userLoc, setUserLoc] = useState([0, 0]);
    const [foods, setFoods] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
    const [viewMode, setViewMode] = useState('available'); // 'available' or 'claims'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        // 1. Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLoc([position.coords.latitude, position.coords.longitude]);
                    fetchFoods(position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    // Fallback: use default location and show ALL food listings
                    console.warn('Geolocation denied, using default location');
                    const defaultLat = 19.0760;
                    const defaultLon = 72.8777;
                    setUserLoc([defaultLat, defaultLon]);
                    setError('Location access denied. Showing default location — all nearby food is displayed.');
                    fetchFoods(defaultLat, defaultLon, true); // true = skip distance filter
                }
            );
        } else {
            const defaultLat = 19.0760;
            const defaultLon = 72.8777;
            setUserLoc([defaultLat, defaultLon]);
            setError('Geolocation not supported. Showing default location.');
            fetchFoods(defaultLat, defaultLon, true);
        }
        fetchMyClaims();
    }, []);

    const fetchMyClaims = async () => {
        const storedUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
        const userId = auth.currentUser?.uid || storedUser.uid;
        if (!userId) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/foods/my-claims/${userId}`);
            if (res.ok) {
                const data = await res.json();
                setMyClaims(data);
            }
        } catch (err) {
            console.error('Failed to fetch claims:', err);
        }
    };

    const fetchFoods = async (userLat, userLon, skipFilter = false) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/foods`);
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();

            // Show ALL unclaimed food from all restaurants
            const availableFoods = data.filter(food => !food.isClaimed);
            setFoods(availableFoods);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Real Claim Functionality
    const handleClaim = async (foodId) => {
        const storedUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
        const userId = auth.currentUser?.uid || storedUser.uid;

        if (!userId) {
            alert('Please sign in to claim food.');
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/foods/${foodId}/claim`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!res.ok) throw new Error('Failed to claim food');

            alert('Food claimed successfully! Please contact the restaurant for pickup.');
            // Refresh
            fetchFoods(userLoc[0], userLoc[1]);
            fetchMyClaims();
        } catch (err) {
            alert(err.message);
        }
    };

    const [showList, setShowList] = useState(false);

    return (
        <div className="h-screen flex flex-col bg-[#f5f0e8] font-['Inter',sans-serif]">
            {/* ─── BRUTALIST NAV ─── */}
            <nav className="brutal-nav bg-[#1a1a1a] border-b-[4px] border-[#ff5722] px-6 py-4 flex justify-between items-center z-[1000] relative">
                <div className="flex items-center gap-4">
                    <div className="bg-[#ff5722] p-2.5 border-[3px] border-black shadow-[4px_4px_0px_#000]">
                        <Navigation className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-[-0.05em] text-white uppercase">
                            FOOD // RESCUE
                        </h1>
                        <p className="text-[10px] font-black text-[#ff5722] uppercase tracking-[0.3em] leading-none mt-0.5">
                            LIVE MAP INTERFACE
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowList(!showList)}
                        className="brutal-btn flex items-center gap-2 bg-[#ff5722] hover:bg-[#e64a19] border-[3px] border-black text-black px-5 py-2.5 font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                    >
                        <Zap size={14} />
                        <span className="hidden sm:inline">{foods.length} LISTING{foods.length !== 1 ? 'S' : ''}</span>
                        <span className="sm:hidden">{foods.length}</span>
                        <ChevronDown size={14} className={`transition-transform ${showList ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="brutal-btn flex items-center gap-2 bg-transparent hover:bg-red-600 border-[3px] border-[#555] hover:border-red-600 text-[#888] hover:text-white font-black text-xs uppercase tracking-widest transition-all px-4 py-2.5 shadow-[3px_3px_0px_#333] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline">EXIT</span>
                    </button>
                </div>
            </nav>

            <main className="flex-1 relative flex overflow-hidden">
                {/* ─── SIDEBAR — RESTAURANT LIST ─── */}
                {showList && (
                    <div className="w-96 bg-[#1a1a1a] border-r-[4px] border-[#ff5722] overflow-y-auto z-[500] brutal-sidebar flex flex-col">
                        {/* Sidebar Header */}
                        <div className="p-5 border-b-[3px] border-[#333] bg-[#111] sticky top-0 z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-black text-white text-lg uppercase tracking-tight">
                                    {viewMode === 'available' ? 'AVAILABLE' : 'MY CLAIMS'}
                                </h2>
                                <button
                                    onClick={() => setShowList(false)}
                                    className="text-[#666] hover:text-white transition-colors p-1"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            {/* Toggle Tabs */}
                            <div className="flex border-[3px] border-[#333] overflow-hidden">
                                <button
                                    onClick={() => setViewMode('available')}
                                    className={`flex-1 text-[10px] font-black py-2.5 uppercase tracking-[0.2em] transition-all ${viewMode === 'available'
                                        ? 'bg-[#ff5722] text-black border-r-[3px] border-[#333]'
                                        : 'bg-[#222] text-[#666] hover:text-white border-r-[3px] border-[#333]'
                                        }`}
                                >
                                    AVAILABLE ({foods.length})
                                </button>
                                <button
                                    onClick={() => setViewMode('claims')}
                                    className={`flex-1 text-[10px] font-black py-2.5 uppercase tracking-[0.2em] transition-all ${viewMode === 'claims'
                                        ? 'bg-[#ff5722] text-black'
                                        : 'bg-[#222] text-[#666] hover:text-white'
                                        }`}
                                >
                                    CLAIMED ({myClaims.length})
                                </button>
                            </div>
                        </div>

                        {/* Sidebar Content */}
                        <div className="flex-1 overflow-y-auto">
                            {viewMode === 'available' ? (
                                foods.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="text-[#555] text-sm font-black uppercase tracking-widest">
                                            NO FOOD AVAILABLE
                                        </div>
                                        <p className="text-[#444] text-xs mt-2 font-mono">Check back later.</p>
                                    </div>
                                ) : (
                                    foods.map((food, index) => (
                                        <div
                                            key={food._id}
                                            className="brutal-food-card p-5 border-b-[3px] border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all group"
                                            onClick={() => {
                                                setUserLoc([food.latitude, food.longitude]);
                                            }}
                                        >
                                            {/* Card Number & Restaurant Name */}
                                            <div className="flex items-start gap-3 mb-3">
                                                <span className="bg-[#ff5722] text-black text-[10px] font-black w-7 h-7 flex items-center justify-center flex-shrink-0 border-[2px] border-black shadow-[2px_2px_0px_#000]">
                                                    {String(index + 1).padStart(2, '0')}
                                                </span>
                                                <div className="min-w-0">
                                                    <h3 className="font-black text-white text-sm uppercase tracking-tight truncate group-hover:text-[#ff5722] transition-colors">
                                                        {food.restaurantName}
                                                    </h3>
                                                    <p className="text-[#777] text-xs mt-0.5 font-medium truncate">{food.foodName}</p>
                                                </div>
                                            </div>
                                            {/* Card Footer */}
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2a2a2a]">
                                                <span className="text-[10px] text-[#555] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <MapPin size={10} /> QTY: {food.quantity}
                                                </span>
                                                <span className={`text-[10px] font-black px-2.5 py-1 uppercase tracking-widest border-[2px] ${food.price === 0
                                                    ? 'bg-[#00e676] text-black border-black shadow-[2px_2px_0px_#000]'
                                                    : 'bg-[#333] text-white border-[#555]'
                                                    }`}>
                                                    {food.price === 0 ? '★ FREE' : `₹${food.price}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                myClaims.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="text-[#555] text-sm font-black uppercase tracking-widest">
                                            NO CLAIMS YET
                                        </div>
                                        <p className="text-[#444] text-xs mt-2 font-mono">Claim food from the map to see it here.</p>
                                    </div>
                                ) : (
                                    myClaims.map((food) => (
                                        <div
                                            key={food._id}
                                            className="p-5 border-b-[3px] border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#222] cursor-pointer transition-all group"
                                            onClick={() => {
                                                setUserLoc([food.latitude, food.longitude]);
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-black text-white text-sm uppercase tracking-tight group-hover:text-[#ff5722] transition-colors">
                                                    {food.restaurantName}
                                                </h3>
                                                <span className="bg-white text-black text-[9px] font-black px-2 py-1 uppercase tracking-[0.2em] border-[2px] border-black shadow-[2px_2px_0px_#000]">
                                                    CLAIMED
                                                </span>
                                            </div>
                                            <p className="text-[#777] text-xs font-medium">{food.foodName}</p>
                                            <p className="text-[10px] text-[#ff5722] mt-3 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                <Phone size={10} /> {food.contactNumber}
                                            </p>
                                        </div>
                                    ))
                                )
                            )}
                        </div>

                        {/* Sidebar Footer */}
                        <div className="p-4 border-t-[3px] border-[#333] bg-[#111]">
                            <p className="text-[9px] text-[#444] font-mono text-center uppercase tracking-widest">
                                FOOD RESCUE // {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                            </p>
                        </div>
                    </div>
                )}

                {/* ─── MAP AREA ─── */}
                <div className="flex-1 relative">
                    {/* Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-0 z-50 bg-[#1a1a1a] flex flex-col items-center justify-center gap-4">
                            <div className="brutal-loader w-12 h-12 border-[4px] border-[#333] border-t-[#ff5722] animate-spin"></div>
                            <div className="text-white font-black text-sm uppercase tracking-[0.3em]">
                                LOCATING<span className="animate-pulse">...</span>
                            </div>
                            <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest">
                                Finding nearby food sources
                            </p>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-[#ff5722] text-black px-6 py-3 border-[3px] border-black shadow-[4px_4px_0px_#000] flex items-center gap-3 max-w-lg w-full mx-4">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <p className="text-xs font-black uppercase tracking-wide">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto hover:opacity-70">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Stats Bar (floating) */}
                    {!loading && (
                        <div className="absolute bottom-6 left-6 z-[500] flex gap-2">
                            <div className="bg-[#1a1a1a] border-[3px] border-black shadow-[4px_4px_0px_#000] px-4 py-2.5 flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#00e676] animate-pulse"></div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {foods.length} LIVE
                                </span>
                            </div>
                            <div className="bg-[#1a1a1a] border-[3px] border-black shadow-[4px_4px_0px_#000] px-4 py-2.5">
                                <span className="text-[10px] font-black text-[#ff5722] uppercase tracking-widest">
                                    {myClaims.length} CLAIMED
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Map */}
                    <MapContainer
                        center={userLoc[0] === 0 ? [51.505, -0.09] : userLoc}
                        zoom={13}
                        scrollWheelZoom={true}
                        className="h-full w-full z-0 brutal-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <ChangeView center={userLoc} />

                        {/* User Location Marker */}
                        {userLoc[0] !== 0 && (
                            <Marker position={userLoc} icon={userIcon}>
                                <Popup>
                                    <div className="font-black text-sm text-black uppercase tracking-tight">
                                        ● YOUR LOCATION
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Restaurant Food Markers */}
                        {foods.map((food) => (
                            <Marker
                                key={food._id}
                                position={[food.latitude, food.longitude]}
                                icon={restaurantIcon}
                            >
                                <Popup className="brutal-popup">
                                    <div className="brutal-popup-inner p-1 min-w-[260px]">
                                        {/* Popup Header */}
                                        <div className="bg-[#1a1a1a] text-white p-4 -m-4 mb-4 border-b-[3px] border-[#ff5722]">
                                            <h3 className="font-black text-lg uppercase tracking-tight leading-tight">
                                                {food.restaurantName}
                                            </h3>
                                            <p className="text-[10px] text-[#888] font-mono uppercase tracking-widest mt-1">
                                                FOOD RESCUE LISTING
                                            </p>
                                        </div>

                                        {/* Food Details */}
                                        <div className="space-y-2.5 mb-4 mt-6">
                                            <div className="flex justify-between items-center py-1.5 border-b-[2px] border-dashed border-[#e0e0e0]">
                                                <span className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em]">FOOD</span>
                                                <span className="font-bold text-[#1a1a1a] text-sm text-right max-w-[160px] truncate">{food.foodName}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5 border-b-[2px] border-dashed border-[#e0e0e0]">
                                                <span className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em]">QTY</span>
                                                <span className="font-bold text-[#1a1a1a] text-sm">{food.quantity}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5 border-b-[2px] border-dashed border-[#e0e0e0]">
                                                <span className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em]">PRICE</span>
                                                {food.price === 0 ? (
                                                    <span className="font-black text-xs bg-[#00e676] text-black px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0px_#000]">
                                                        ★ FREE
                                                    </span>
                                                ) : (
                                                    <span className="font-black text-[#1a1a1a] text-base">₹{food.price}</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center py-1.5">
                                                <span className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] flex items-center gap-1">
                                                    <Clock size={10} /> PICKUP
                                                </span>
                                                <span className="font-black text-[#1a1a1a] text-sm">{food.pickupTime}</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {food.description && (
                                            <div className="bg-[#f5f0e8] p-3 border-[2px] border-[#e0d8c8] mb-4">
                                                <p className="text-[11px] text-[#666] leading-relaxed font-medium">{food.description}</p>
                                            </div>
                                        )}

                                        {/* Contact & Actions */}
                                        <div className="space-y-3 mt-4">
                                            <p className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em] text-center flex items-center justify-center gap-1.5">
                                                <Phone size={10} /> {food.contactNumber}
                                            </p>
                                            <div className="flex gap-2">
                                                <a
                                                    href={`tel:${food.contactNumber}`}
                                                    className="flex-1 flex justify-center items-center gap-1.5 bg-white hover:bg-[#f5f0e8] border-[2px] border-black text-black py-2.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                                                >
                                                    <Phone size={12} /> CALL
                                                </a>
                                                <a
                                                    href={`https://wa.me/${food.contactNumber.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex justify-center items-center gap-1.5 bg-[#25D366] hover:bg-[#1da851] border-[2px] border-black text-black py-2.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                                                >
                                                    <MessageCircle size={12} /> WHATSAPP
                                                </a>
                                            </div>
                                            <button
                                                onClick={() => handleClaim(food._id)}
                                                className="w-full bg-[#ff5722] hover:bg-[#e64a19] text-black py-3.5 text-[11px] font-black uppercase tracking-[0.2em] border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                                            >
                                                ▶ CLAIM THIS FOOD
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </main>
        </div>
    );
}
