import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LogOut, Navigation, Phone, MessageCircle, AlertCircle } from 'lucide-react';

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
        <div className="h-screen flex flex-col bg-[#f9f4ea] font-sans">
            <nav className="bg-[#fdfaf5] shadow-sm border-b border-[#f3f0e8] px-8 py-5 flex justify-between items-center z-[1000] relative">
                <div className="flex items-center gap-3">
                    <div className="bg-[#1a1816] p-2 rounded-xl shadow-sm">
                        <Navigation className="text-[#fdfaf5]" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-[#1a1816]">Nearby Food</h1>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-1">Food Rescue Map</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowList(!showList)}
                        className="flex items-center gap-2 bg-[#fdfaf5] hover:bg-[#f3f0e8] border border-[#efeadc] text-[#2d2a26] px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm"
                    >
                        🍽️ {foods.length} Restaurant{foods.length !== 1 ? 's' : ''} Available
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-[#8c7e6a] hover:text-red-600 font-bold text-sm transition-all px-4 py-2 rounded-xl hover:bg-red-50"
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </nav>

            <main className="flex-1 relative flex">
                {/* Sidebar - Restaurant List */}
                {showList && (
                    <div className="w-80 bg-[#fdfaf5] border-r border-[#f3f0e8] overflow-y-auto z-[500] shadow-xl">
                        <div className="p-5 border-b border-[#f3f0e8] bg-[#fdfaf5] sticky top-0 z-10">
                            <div className="flex bg-[#f9f4ea] p-1 rounded-xl border border-[#efeadc] mb-4">
                                <button
                                    onClick={() => setViewMode('available')}
                                    className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-all ${viewMode === 'available' ? 'bg-[#fdfaf5] text-[#1a1816] shadow-sm' : 'text-[#8c7e6a] hover:text-[#1a1816]'}`}
                                >
                                    AVAILABLE
                                </button>
                                <button
                                    onClick={() => setViewMode('claims')}
                                    className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-all ${viewMode === 'claims' ? 'bg-[#fdfaf5] text-[#1a1816] shadow-sm' : 'text-[#8c7e6a] hover:text-[#1a1816]'}`}
                                >
                                    MY CLAIMS
                                </button>
                            </div>
                            <h2 className="font-black tracking-tight text-[#1a1816] text-lg">
                                {viewMode === 'available' ? `Nearby Food (${foods.length})` : `My Claims (${myClaims.length})`}
                            </h2>
                        </div>

                        {viewMode === 'available' ? (
                            foods.length === 0 ? (
                                <div className="p-8 text-center text-[#8c7e6a] text-sm font-bold">
                                    No food available right now.
                                </div>
                            ) : (
                                foods.map((food) => (
                                    <div
                                        key={food._id}
                                        className="p-5 border-b border-[#f3f0e8] bg-[#fdfaf5] hover:bg-[#f9f4ea] cursor-pointer transition-all"
                                        onClick={() => {
                                            setUserLoc([food.latitude, food.longitude]);
                                        }}
                                    >
                                        <h3 className="font-black text-[#1a1816] text-base">{food.restaurantName}</h3>
                                        <p className="text-[#6b6256] text-sm mt-1 font-medium">{food.foodName}</p>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-xs text-[#8c7e6a] font-bold">Qty: {food.quantity}</span>
                                            <span className={`text-xs font-black px-2 py-1 rounded-md ${food.price === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-[#f3f0e8] text-[#2d2a26]'}`}>
                                                {food.price === 0 ? 'FREE' : `₹${food.price}`}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            myClaims.length === 0 ? (
                                <div className="p-8 text-center text-[#8c7e6a] text-sm font-bold">
                                    You haven't claimed any food yet.
                                </div>
                            ) : (
                                myClaims.map((food) => (
                                    <div
                                        key={food._id}
                                        className="p-5 border-b border-[#f3f0e8] bg-[#fdfaf5] hover:bg-[#f9f4ea] cursor-pointer transition-all"
                                        onClick={() => {
                                            setUserLoc([food.latitude, food.longitude]);
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-black text-[#1a1816] text-base">{food.restaurantName}</h3>
                                            <span className="bg-[#1a1816] text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest">Claimed</span>
                                        </div>
                                        <p className="text-[#6b6256] text-sm mt-1 font-medium">{food.foodName}</p>
                                        <p className="text-[10px] text-[#8c7e6a] mt-3 font-bold uppercase tracking-widest flex items-center gap-1"><Phone size={10} /> {food.contactNumber}</p>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                )}

                {/* Map Area */}
                <div className="flex-1 relative">
                    {loading && (
                        <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center">
                            <div className="text-emerald-600 font-semibold flex items-center gap-2">
                                <span className="animate-spin text-2xl">↻</span> Locating you & finding food...
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-amber-100 text-amber-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md w-full mx-4">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <MapContainer
                        center={userLoc[0] === 0 ? [51.505, -0.09] : userLoc}
                        zoom={13}
                        scrollWheelZoom={true}
                        className="h-full w-full z-0"
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
                                    <div className="font-semibold text-gray-800">You are here</div>
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
                                <Popup className="food-popup custom-popup">
                                    <div className="p-2 min-w-[220px]">
                                        <h3 className="font-black text-xl text-[#1a1816] mb-2 tracking-tight">{food.restaurantName}</h3>
                                        <div className="text-sm space-y-2 mb-4">
                                            <p className="flex justify-between"><span className="text-[#8c7e6a] font-bold text-[10px] uppercase tracking-widest mt-1">Food</span> <span className="font-medium text-[#2d2a26] text-right">{food.foodName}</span></p>
                                            <p className="flex justify-between"><span className="text-[#8c7e6a] font-bold text-[10px] uppercase tracking-widest mt-1">Quantity</span> <span className="font-medium text-[#2d2a26] text-right">{food.quantity}</span></p>
                                            <p className="flex justify-between border-b border-[#f3f0e8] pb-2">
                                                <span className="text-[#8c7e6a] font-bold text-[10px] uppercase tracking-widest mt-1">Price</span>
                                                {food.price === 0 ? (
                                                    <span className="text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded text-xs">FREE</span>
                                                ) : (
                                                    <span className="font-black text-[#1a1816]">₹{food.price}</span>
                                                )}
                                            </p>
                                            <p className="flex justify-between pt-1"><span className="text-[#8c7e6a] font-bold text-[10px] uppercase tracking-widest mt-1">Pickup By</span> <span className="font-bold text-[#2d2a26]">{food.pickupTime}</span></p>
                                            {food.description && <p className="text-[#6b6256] text-xs mt-3 bg-[#fdfaf5] p-2 rounded-lg border border-[#f3f0e8] leading-relaxed">{food.description}</p>}
                                        </div>

                                        <div className="flex flex-col gap-3 mt-5">
                                            <p className="text-[11px] font-bold text-[#8c7e6a] uppercase tracking-widest flex items-center justify-center gap-1">
                                                <Phone size={12} /> {food.contactNumber}
                                            </p>
                                            <div className="flex gap-2">
                                                <a
                                                    href={`tel:${food.contactNumber}`}
                                                    className="flex-1 flex justify-center items-center gap-1.5 bg-[#fdfaf5] hover:bg-[#f3f0e8] border border-[#efeadc] text-[#2d2a26] py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                                                >
                                                    <Phone size={14} /> Call
                                                </a>
                                                <a
                                                    href={`https://wa.me/${food.contactNumber.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 flex justify-center items-center gap-1.5 bg-[#fdfaf5] hover:bg-[#f3f0e8] border border-[#efeadc] text-emerald-700 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                                                >
                                                    <MessageCircle size={14} /> WhatsApp
                                                </a>
                                            </div>
                                            <button
                                                onClick={() => handleClaim(food._id)}
                                                className="w-full bg-[#1a1816] hover:bg-[#2d2a26] text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all mt-1"
                                            >
                                                Claim Food
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
