import React, { useState, useEffect, useMemo } from 'react';
import { studyRoomService } from '../../services/libraryService';
import { Calendar, Clock, Users, MapPin, Wifi, Coffee, Monitor, Volume2, X, Check, Star, ChevronRight, Zap, Shield, BookOpen, Search } from 'lucide-react';

const styles = `
  .premium-card {
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  .premium-card:hover {
    transform: translateY(-15px);
    border: 1px solid #25f194;
    box-shadow: 0 30px 60px -15px rgba(37, 241, 148, 0.2);
  }
  .image-container {
    clip-path: polygon(0 0, 100% 0, 100% 92%, 0% 100%);
    transition: clip-path 0.4s ease;
  }
  .premium-card:hover .image-container {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
  }
  .bg-god-glass {
    background: linear-gradient(135deg, rgba(37, 241, 148, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
    background-attachment: fixed;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .ai-pulse {
    animation: pulse 2s infinite;
  }
  .booking-modal {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.95);
  }
  .glass-input {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
  .glass-input:focus {
    background: rgba(255, 255, 255, 0.9);
    border-color: #25f194;
    box-shadow: 0 0 0 3px rgba(37, 241, 148, 0.1);
  }
`;

const Button = ({ children, className = '', variant = 'default', size = 'md', ...props }) => {
  const baseStyles = 'font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2';
  
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-lg',
    primary: 'bg-[#25f194] text-slate-900 hover:bg-emerald-400 hover:shadow-xl hover:scale-105',
    secondary: 'bg-white/70 text-slate-700 hover:bg-white border border-white/50 backdrop-blur-md',
    ghost: 'text-slate-600 hover:bg-slate-100'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function StudyRooms() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    duration: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [studyRooms, setStudyRooms] = useState([]);
  const [usingDummy, setUsingDummy] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const DUMMY_ROOMS = useMemo(() => ([
    {
      id: 'd1',
      name: 'A1 - Quiet Focus Room',
      capacity: 6,
      type: 'Main Library - Floor 1',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
      amenities: ['Wifi', 'Whiteboard', 'AC'],
      description: 'Quiet room with whiteboard and AC.',
      availability: 'Available',
      popularTimes: ['9:00 AM', '2:00 PM', '7:00 PM'],
      bookings: 12
    },
    {
      id: 'd2',
      name: 'A2 - Collaboration Hub',
      capacity: 4,
      type: 'Main Library - Floor 1',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&q=80&w=800',
      amenities: ['Wifi', 'Coffee', 'Monitor'],
      description: 'Perfect for small group discussions.',
      availability: 'Available',
      popularTimes: ['10:00 AM', '3:00 PM'],
      bookings: 8
    },
    {
      id: 'd3',
      name: 'B1 - Presentation Room',
      capacity: 10,
      type: 'Science Building - Floor 2',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1452457752217-19f1f36d8d62?auto=format&fit=crop&q=80&w=800',
      amenities: ['Projector', 'Monitor', 'Wifi', 'Whiteboard'],
      description: 'Large room for presentations.',
      availability: 'Busy',
      popularTimes: ['11:00 AM', '4:00 PM'],
      bookings: 24
    },
    {
      id: 'd4',
      name: 'B2 - Silent Zone',
      capacity: 2,
      type: 'Science Building - Floor 2',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800',
      amenities: ['Silence', 'Natural Light'],
      description: 'Ultra quiet space for deep focus.',
      availability: 'Available',
      popularTimes: ['8:00 AM', '6:00 PM'],
      bookings: 5
    },
    {
      id: 'd5',
      name: 'C1 - Tech Studio',
      capacity: 5,
      type: 'Innovation Center - Floor 3',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800',
      amenities: ['Coding Setup', 'Multiple Screens', 'Wifi'],
      description: 'Workstation with multi-monitor setup.',
      availability: 'Available',
      popularTimes: ['1:00 PM', '7:00 PM'],
      bookings: 16
    },
    {
      id: 'd6',
      name: 'C2 - Brainstorm Room',
      capacity: 8,
      type: 'Innovation Center - Floor 3',
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
      amenities: ['Whiteboard', 'Coffee', 'Plants'],
      description: 'Bright room ideal for ideation.',
      availability: 'Available',
      popularTimes: ['9:00 AM', '5:00 PM'],
      bookings: 10
    }
  ]), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingRooms(true);
        setErrorMsg('');
        const res = await studyRoomService.getAll();
        const raw = res?.data?.data || res?.data || [];
        const mapped = raw.map((r) => {
          const availability =
            typeof r.isActive === 'boolean'
              ? (r.isActive ? 'Available' : 'Busy')
              : (String(r.status).toLowerCase() === 'available' ? 'Available' : 'Busy');
          const amenities =
            Array.isArray(r.facilities) ? r.facilities :
            Array.isArray(r.amenities) ? r.amenities : [];
          const type = r.building
            ? `${r.building} - Floor ${r.floor ?? ''}`
            : (r.floor ? String(r.floor) : 'Study Room');
          return {
            id: r._id || r.id,
            name: r.name || r.roomNumber || 'Study Room',
            capacity: Number(r.capacity || r.seats || 1),
            type,
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
            amenities,
            description: r.description || 'Comfortable study space.',
            availability,
            popularTimes: ['9:00 AM', '2:00 PM', '7:00 PM'],
            bookings: 0
          };
        });
        if (!mounted) return;
        setStudyRooms(mapped.length ? mapped : DUMMY_ROOMS);
        setUsingDummy(mapped.length === 0);
        setLoadingRooms(false);
      } catch {
        if (!mounted) return;
        setStudyRooms(DUMMY_ROOMS);
        setUsingDummy(true);
        setErrorMsg('Failed to load study rooms. Showing demo data.');
        setLoadingRooms(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  
  useEffect(() => {
    let mounted = true;
    const fetchAvailability = async () => {
      if (!selectedRoom || !bookingData.date) return;
      try {
        setCheckingAvailability(true);
        const res = await studyRoomService.getAvailability(selectedRoom.id, bookingData.date);
        const raw = res?.data?.data || res?.data || [];
        if (!mounted) return;
        const slots = Array.isArray(raw) ? raw : (Array.isArray(raw?.slots) ? raw.slots : []);
        setAvailabilitySlots(slots);
      } catch {
        if (!mounted) return;
        setAvailabilitySlots([]);
      } finally {
        setCheckingAvailability(false);
      }
    };
    fetchAvailability();
    return () => { mounted = false; };
  }, [selectedRoom, bookingData.date]);
  
  const amenityIcons = {
    "Wifi": Wifi,
    "Coffee": Coffee,
    "Monitor": Monitor,
    "Whiteboard": BookOpen,
    "Quiet Zone": Volume2,
    "Drawing Tablet": Monitor,
    "Coding Setup": Monitor,
    "Multiple Screens": Monitor,
    "Plants": BookOpen,
    "Natural Light": BookOpen,
    "Silence": Volume2,
    "Projector": Monitor,
    "Presentation Tools": Monitor
  };

  const avgRating = useMemo(() => {
    if (!studyRooms.length) return 0;
    const s = studyRooms.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return (s / studyRooms.length).toFixed(1);
  }, [studyRooms]);

  const floorsCount = useMemo(() => {
    const floors = new Set(
      studyRooms
        .map((r) => {
          const t = String(r.type || '');
          const m = t.match(/Floor\s*(\d+)/i) || t.match(/(\d+)\w*\s*Floor/i);
          return m ? m[1] : null;
        })
        .filter(Boolean)
    );
    return floors.size || 0;
  }, [studyRooms]);

  const filteredRooms = useMemo(() => {
    let arr = [...studyRooms];
    if (availabilityFilter !== 'all') {
      arr = arr.filter((r) =>
        availabilityFilter === 'available' ? r.availability === 'Available' : r.availability !== 'Available'
      );
    }
    if (capacityFilter !== 'all') {
      if (capacityFilter === '1') arr = arr.filter((r) => r.capacity === 1);
      if (capacityFilter === '2-4') arr = arr.filter((r) => r.capacity >= 2 && r.capacity <= 4);
      if (capacityFilter === '5+') arr = arr.filter((r) => r.capacity >= 5);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter(
        (r) =>
          String(r.name).toLowerCase().includes(q) ||
          String(r.type).toLowerCase().includes(q) ||
          String(r.description).toLowerCase().includes(q)
      );
    }
    if (sortBy === 'capacity') arr.sort((a, b) => b.capacity - a.capacity);
    else if (sortBy === 'rating') arr.sort((a, b) => Number(b.rating) - Number(a.rating));
    return arr;
  }, [studyRooms, searchQuery, availabilityFilter, capacityFilter, sortBy]);

  const availableCount = useMemo(
    () => studyRooms.filter((r) => r.availability === 'Available').length,
    [studyRooms]
  );

  const handleBooking = (e) => {
    e.preventDefault();
    const dur = String(bookingData.duration || '');
    const addHours =
      dur === '1h' ? 1 :
      dur === '2h' ? 2 :
      dur === '3h' ? 3 :
      dur === '4h' ? 4 :
      dur === 'full' ? 8 : 0;
    let endTime = bookingData.endTime;
    if (!endTime && bookingData.startTime && addHours) {
      const [h, m] = bookingData.startTime.split(':').map((n) => parseInt(n, 10));
      const dt = new Date();
      dt.setHours(h, m, 0, 0);
      dt.setHours(dt.getHours() + addHours);
      const eh = String(dt.getHours()).padStart(2, '0');
      const em = String(dt.getMinutes()).padStart(2, '0');
      endTime = `${eh}:${em}`;
    }
    (async () => {
      try {
        setBookingError('');
        if (!usingDummy) {
          await studyRoomService.createBooking({
            roomId: selectedRoom?.id,
            date: bookingData.date,
            startTime: bookingData.startTime,
            endTime,
            purpose: bookingData.purpose,
            duration: bookingData.duration,
          });
        }
        setBookingSuccess(true);
        setTimeout(() => {
          setShowBookingModal(false);
          setBookingSuccess(false);
          setBookingData({ date: '', startTime: '', endTime: '', purpose: '', duration: '' });
        }, 2000);
      } catch (err) {
        setBookingError('Booking failed. Please try again.');
      }
    })();
  };

  const openBookingModal = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  return (
    <div className="min-h-screen bg-god-glass p-4 md:p-10 font-sans">
      <style>{styles}</style>

      {/* HERO HEADER */}
      <header className="max-w-7xl mx-auto mb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#25f194]/20 text-emerald-700 px-6 py-2 rounded-full text-sm font-black tracking-widest uppercase mb-8">
          <Zap size={16} className="ai-pulse" />
          Premium Study Spaces
        </div>
        
        <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight mb-6">
          Book Your Perfect <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Study Zone</span>
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Reserve premium study spaces designed for productivity, collaboration, and focused learning.
        </p>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-6">
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-emerald-500 mb-2">{studyRooms.length}</div>
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Rooms</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-blue-500 mb-2">{availableCount}</div>
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Available Now</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-amber-500 mb-2">{avgRating}</div>
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Satisfaction</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-rose-500 mb-2">{floorsCount}</div>
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Floors</div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 premium-card p-3">
            <Search size={18} className="text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room, building, description..."
              className="w-full bg-transparent outline-none text-slate-700"
            />
          </div>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="premium-card p-3 text-slate-700"
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="premium-card p-3 text-slate-700"
            >
              <option value="all">Any capacity</option>
              <option value="1">1</option>
              <option value="2-4">2–4</option>
              <option value="5+">5+</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="premium-card p-3 text-slate-700"
            >
              <option value="recommended">Recommended</option>
              <option value="capacity">Capacity</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>
      </header>

      {/* STUDY ROOMS GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {filteredRooms.length === 0 && (
          <div className="premium-card p-6 text-center col-span-full">
            <div className="text-sm font-bold text-slate-600">No rooms found</div>
          </div>
        )}
        {filteredRooms.map((room, index) => (
          <div 
            key={room.id} 
            className="premium-card group rounded-3xl overflow-hidden"
            style={{ animation: `fadeInUp 0.6s ease-out forwards ${index * 0.1}s`, opacity: 0 }}
          >
            <div className="image-container relative h-48 overflow-hidden">
              <img src={room.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={room.name} />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md border ${
                  room.availability === 'Available' 
                    ? 'bg-emerald-500/90 text-white border-emerald-400' 
                    : 'bg-red-500/90 text-white border-red-400'
                }`}>
                  {room.availability}
                </span>
              </div>
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-bold">
                {room.capacity} {room.capacity === 1 ? 'Person' : 'People'}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{room.type}</span>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-slate-700">{room.rating}</span>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-3">{room.name}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{room.description}</p>

              {/* Amenities */}
              <div className="flex flex-wrap gap-2 mb-5">
                {room.amenities.slice(0, 4).map((amenity, idx) => {
                  const IconComponent = amenityIcons[amenity] || BookOpen;
                  return (
                    <div key={idx} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                      <IconComponent size={12} className="text-slate-500" />
                      <span className="text-xs font-medium text-slate-600">{amenity}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mb-5">
                <div className="text-lg font-black text-emerald-600">
                  Free Booking
                </div>
                <div className="text-xs text-slate-500">
                  {room.bookings} bookings
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => openBookingModal(room)}
                disabled={room.availability === 'Busy'}
              >
                {room.availability === 'Available' ? 'Reserve Now' : 'Unavailable'}
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="booking-modal rounded-3xl shadow-2xl max-w-md w-full border border-white/50">
            {bookingSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Booking Confirmed!</h3>
                <p className="text-slate-600">Your study room has been successfully reserved.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Reserve {selectedRoom?.name}</h3>
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">Free Reservation • {selectedRoom?.type}</p>
                </div>

                <form onSubmit={handleBooking} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                      <input
                        type="date"
                        required
                        value={bookingData.date}
                        onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                        className="glass-input w-full px-4 py-3 rounded-xl outline-none transition-all"
                      />
                    <div className="text-xs text-slate-500 mt-2">
                      {checkingAvailability ? 'Checking availability...' : (availabilitySlots.length ? `Available: ${availabilitySlots.join(', ')}` : 'No availability info')}
                    </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Duration</label>
                      <select
                        required
                        value={bookingData.duration}
                        onChange={(e) => setBookingData(prev => ({ ...prev, duration: e.target.value }))}
                        className="glass-input w-full px-4 py-3 rounded-xl outline-none transition-all"
                      >
                        <option value="">Select</option>
                        <option value="1h">1 Hour</option>
                        <option value="2h">2 Hours</option>
                        <option value="3h">3 Hours</option>
                        <option value="4h">4 Hours</option>
                        <option value="full">Full Day</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Start Time</label>
                      <select
                        required
                        value={bookingData.startTime}
                        onChange={(e) => setBookingData(prev => ({ ...prev, startTime: e.target.value }))}
                        className="glass-input w-full px-4 py-3 rounded-xl outline-none transition-all"
                      >
                        <option value="">Time</option>
                        <option value="08:00">8:00 AM</option>
                        <option value="09:00">9:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">1:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="15:00">3:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="17:00">5:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                        <option value="19:00">7:00 PM</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Purpose</label>
                      <select
                        required
                        value={bookingData.purpose}
                        onChange={(e) => setBookingData(prev => ({ ...prev, purpose: e.target.value }))}
                        className="glass-input w-full px-4 py-3 rounded-xl outline-none transition-all"
                      >
                        <option value="">Select</option>
                        <option value="study">Study</option>
                        <option value="meeting">Meeting</option>
                        <option value="project">Project Work</option>
                        <option value="research">Research</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowBookingModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" className="flex-1">
                      Confirm Booking
                      <Check size={18} />
                    </Button>
                  </div>
                  {bookingError && (
                    <div className="mt-3 text-center text-xs font-bold text-red-600">
                      {bookingError}
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

