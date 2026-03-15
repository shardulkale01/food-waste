import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { MapPin, LogOut, Loader2, CheckCircle2, Navigation, Clock, Phone, Utensils, IndianRupee } from 'lucide-react';
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
            restaurantName: user.restaurantName || user.displayName || 'Restaurant',
            price: Number(formData.price)
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/add-food`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to post food listing');

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
        <div className="min-h-screen marble-bg text-[#2d2a26]">
            {/* Nav */}
            <nav className="bg-white/70 backdrop-blur-md border-b border-[#f3f0e8] px-8 py-5 flex justify-between items-center sticky top-0 z-[1000]">
                <div className="flex items-center gap-3">
                    <div className="bg-[#1a1816] p-2 rounded-xl">
                        <Utensils className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-[#1a1816]">Restaurant Panel</h1>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{user.restaurantName || user.displayName || 'Partner'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-[#8c7e6a] hover:text-red-600 font-bold text-sm transition-all px-4 py-2 rounded-xl hover:bg-red-50"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </nav>

            <main className="max-w-4xl mx-auto py-12 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Form */}
                    <div className="lg:col-span-7 animate-fade-in-up">
                        <div className="marble-card p-10 bg-white">
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-[#1a1816] tracking-tight">Post Surplus Food</h2>
                                <p className="text-[#6b6256] mt-2 font-medium">Help reduce waste by sharing your excess fresh food.</p>
                            </div>

                            {success && (
                                <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fade-in">
                                    <div className="bg-emerald-500 p-1 rounded-full">
                                        <CheckCircle2 size={16} className="text-white" />
                                    </div>
                                    <span className="text-sm font-bold">Listing published successfully!</span>
                                </div>
                            )}

                            {error && (
                                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-sm font-bold animate-fade-in">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">Food Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.foodName}
                                            onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                                            className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] px-4 py-4 text-sm font-medium focus:ring-4 focus:ring-emerald-50"
                                            placeholder="e.g. 5 Boxes of Fresh Pasta"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">Quantity</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] px-4 py-4 text-sm font-medium focus:ring-4 focus:ring-emerald-50"
                                            placeholder="e.g. 10 meals / 5kg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">Price (₹)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8c7e6a]">
                                                <IndianRupee size={16} />
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] pl-11 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-emerald-50"
                                                placeholder="0 for free"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1 transition-all">Valid Until</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8c7e6a]">
                                                <Clock size={16} />
                                            </div>
                                            <input
                                                type="time"
                                                required
                                                value={formData.pickupTime}
                                                onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                                                className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] pl-11 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-emerald-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">Contact No</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8c7e6a]">
                                                <Phone size={16} />
                                            </div>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.contactNumber}
                                                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                                className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] pl-11 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-emerald-50"
                                                placeholder="Phone/WhatsApp"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#8c7e6a] uppercase tracking-widest mb-2 ml-1">Description</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="block w-full rounded-2xl bg-[#fdfaf5] border border-[#f3f0e8] px-4 py-4 text-sm font-medium focus:ring-4 focus:ring-emerald-50"
                                        placeholder="Dietary info or pickup instructions..."
                                    ></textarea>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center gap-3 py-5 rounded-2xl bg-[#1a1816] text-white text-sm font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                <Navigation size={18} />
                                                Publish Listing
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Location */}
                    <div className="lg:col-span-5 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                        <div className="marble-card p-8 bg-white overflow-hidden">
                            <h3 className="text-xl font-black text-[#1a1816] mb-4 flex items-center gap-2">
                                <MapPin size={22} className="text-emerald-600" />
                                Store Location
                            </h3>

                            <div className="bg-[#fdfaf5] p-4 rounded-2xl border border-[#f3f0e8] mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={`w-2 h-2 rounded-full ${locSource === 'gps' ? 'bg-emerald-500 animate-pulse' : 'bg-[#8c7e6a]'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8c7e6a]">
                                        {locSource === 'gps' ? 'GPS Active' : 'Manual Placement'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#8c7e6a] uppercase mb-1">Lat</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={restaurantLoc[0]}
                                            onChange={(e) => {
                                                const lat = parseFloat(e.target.value) || 0;
                                                setRestaurantLoc([lat, restaurantLoc[1]]);
                                                setLocSource('manual');
                                            }}
                                            className="w-full bg-white border border-[#f3f0e8] rounded-xl p-2 text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-[#8c7e6a] uppercase mb-1">Lng</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={restaurantLoc[1]}
                                            onChange={(e) => {
                                                const lng = parseFloat(e.target.value) || 0;
                                                setRestaurantLoc([restaurantLoc[0], lng]);
                                                setLocSource('manual');
                                            }}
                                            className="w-full bg-white border border-[#f3f0e8] rounded-xl p-2 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl overflow-hidden border-4 border-[#f9f4ea] shadow-inner" style={{ height: '320px' }}>
                                <MapContainer
                                    center={restaurantLoc}
                                    zoom={14}
                                    scrollWheelZoom={true}
                                    className="h-full w-full"
                                    key={restaurantLoc.join(',')}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={restaurantLoc} icon={restaurantIcon}>
                                        <Popup>Your Store</Popup>
                                    </Marker>
                                    <ClickHandler onLocationChange={(lat, lng) => {
                                        setRestaurantLoc([lat, lng]);
                                        setLocSource('manual');
                                    }} />
                                </MapContainer>
                            </div>
                            <p className="text-[10px] text-[#8c7e6a] mt-4 text-center font-bold uppercase tracking-tighter">
                                👆 Tap the map to move the marker to your precise door location
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: My Recent Postings */}
                <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="marble-card p-10 bg-white">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-[#1a1816] tracking-tight">Manage Postings</h2>
                                <p className="text-[#6b6256] mt-1 font-medium">Tracking your impact on food rescue.</p>
                            </div>
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">
                                {myPostings.length} Total Postings
                            </span>
                        </div>

                        {myPostings.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-[#f3f0e8] rounded-3xl">
                                <p className="text-[#8c7e6a] font-bold text-sm">No postings yet. Start by filling the form above!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myPostings.slice().reverse().map((post) => (
                                    <div key={post._id} className="p-6 bg-[#fdfaf5] border border-[#f3f0e8] rounded-2xl hover:border-emerald-200 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-black text-[#1a1816]">{post.foodName}</h4>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${post.isClaimed ? 'bg-[#1a1816] text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                                                {post.isClaimed ? 'Claimed' : 'Available'}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-[#6b6256] font-medium flex items-center gap-1">
                                                <Clock size={12} /> Pickup by {post.pickupTime}
                                            </p>
                                            <p className="text-xs text-[#6b6256] font-medium">Quantity: {post.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
