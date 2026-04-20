import React, { useEffect, useMemo, useRef, useState } from 'react';
import { studyRoomService, reservationService } from '../../services/libraryService';
import { Wifi, Coffee, Monitor, X, Check, Star, ChevronRight, Zap, Shield, BookOpen, Search } from 'lucide-react';
import SeatReservation from './SeatReservation';

const styles = `
  .premium-card {
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  .premium-card:hover {
    transform: translateY(-15px);
    border: 1px solid #3b82f6;
    box-shadow: 0 30px 60px -15px rgba(59, 130, 246, 0.2);
  }
  .image-container {
    clip-path: polygon(0 0, 100% 0, 100% 92%, 0% 100%);
    transition: clip-path 0.4s ease;
  }
  .premium-card:hover .image-container {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
  }
  .bg-god-glass {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
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
  .ai-pulse { animation: pulse 2s infinite; }
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
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
`;

const Button = ({ children, className = '', variant = 'default', size = 'md', ...props }) => {
  const baseStyles = 'font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2';
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-blue-700 hover:shadow-lg',
    primary: 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-xl hover:scale-105',
    secondary: 'bg-white/70 text-slate-700 hover:bg-white border border-white/50 backdrop-blur-md',
    ghost: 'text-slate-600 hover:bg-slate-100'
  };
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-sm', lg: 'px-8 py-4 text-base' };
  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const amenityIcons = {
  'Wifi': Wifi, 'Projector': Monitor, 'Whiteboard': BookOpen,
  'Computer': Monitor, 'Air Conditioning': Shield, 'AC': Shield, 'Power Outlets': Zap,
  'Printer Access': BookOpen, 'Coffee': Coffee, 'Monitor': Monitor
};

export default function StudyRooms() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const bookingPanelRef = useRef(null);
  const [bookingData, setBookingData] = useState({
    date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', purpose: '', duration: '', userName: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [studyRooms, setStudyRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [roomReservations, setRoomReservations] = useState([]);

  // Fetch study rooms
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingRooms(true);
        setErrorMsg('');
        const res = await studyRoomService.getAll();
        const raw = res?.data?.data || res?.data || [];
        const mapped = raw.map((r) => {
          const availability = typeof r.isActive === 'boolean'
            ? (r.isActive ? 'Available' : 'Busy')
            : (String(r.status).toLowerCase() === 'available' ? 'Available' : 'Busy');
          const amenities = Array.isArray(r.facilities) ? r.facilities : [];
          const type = r.building ? `${r.building} - Floor ${r.floor ?? ''}` : (r.floor ? `Floor ${r.floor}` : 'Study Room');
          return {
            id: r._id || r.id,
            name: r.name || r.roomNumber || 'Study Room',
            capacity: Number(r.capacity || 1),
            type,
            rating: 4.8,
            image: r.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
            amenities,
            description: r.description || '',
            availability,
            popularTimes: ['9:00 AM', '2:00 PM', '7:00 PM'],
            bookings: 0
          };
        });
        if (mounted) {
          setStudyRooms(mapped);
          setLoadingRooms(false);
        }
      } catch (err) {
        if (mounted) {
          setErrorMsg('Failed to load study rooms from the server.');
          setLoadingRooms(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch today's study room reservations
  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        // Students are not allowed to call the admin-only GET /reservations endpoint.
        // Use /reservations/my-reservations and filter to today.
        const res = await reservationService.getMine({ type: 'Study Room' });
        const raw = res?.data?.data?.reservations || [];
        const filtered = (Array.isArray(raw) ? raw : []).filter((r) => {
          const d = r?.reservationDate;
          if (!d) return false;
          try {
            const iso = new Date(d).toISOString().split('T')[0];
            return iso === today;
          } catch {
            return String(d).slice(0, 10) === today;
          }
        });
        if (m) setRoomReservations(filtered);
      } catch {
        if (m) setRoomReservations([]);
      }
    })();
    return () => { m = false; };
  }, [bookingSuccess]);

  const avgRating = useMemo(() => {
    if (!studyRooms.length) return 0;
    const s = studyRooms.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return (s / studyRooms.length).toFixed(1);
  }, [studyRooms]);

  const floorsCount = useMemo(() => {
    const floors = new Set(
      studyRooms.map((r) => {
        const t = String(r.type || '');
        const m = t.match(/Floor\s*(\d+)/i) || t.match(/(\d+)\w*\s*Floor/i);
        return m ? m[1] : null;
      }).filter(Boolean)
    );
    return floors.size || 0;
  }, [studyRooms]);

  const filteredRooms = useMemo(() => {
    let arr = [...studyRooms];
    if (availabilityFilter !== 'all') {
      arr = arr.filter((r) => availabilityFilter === 'available' ? r.availability === 'Available' : r.availability !== 'Available');
    }
    if (capacityFilter !== 'all') {
      if (capacityFilter === '1') arr = arr.filter((r) => r.capacity === 1);
      else if (capacityFilter === '2-4') arr = arr.filter((r) => r.capacity >= 2 && r.capacity <= 4);
      else if (capacityFilter === '5+') arr = arr.filter((r) => r.capacity >= 5);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      arr = arr.filter((r) =>
        String(r.name).toLowerCase().includes(q) ||
        String(r.type).toLowerCase().includes(q) ||
        String(r.description).toLowerCase().includes(q)
      );
    }
    if (sortBy === 'capacity') arr.sort((a, b) => b.capacity - a.capacity);
    if (sortBy === 'rating') arr.sort((a, b) => Number(b.rating) - Number(a.rating));
    return arr;
  }, [studyRooms, searchQuery, availabilityFilter, capacityFilter, sortBy]);

  const availableCount = useMemo(
    () => studyRooms.filter((r) => r.availability === 'Available').length,
    [studyRooms]
  );

  const handleBooking = async (e) => {
    e.preventDefault();
    const dur = String(bookingData.duration || '');
    const addHours = dur === '1h' ? 1 : dur === '2h' ? 2 : dur === '3h' ? 3 : dur === '4h' ? 4 : dur === 'full' ? 8 : 0;
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

    try {
      setBookingError('');
      await studyRoomService.createBooking({
        studyRoomId: selectedRoom?.id,
        refName: selectedRoom?.name || 'Study Room',
        type: 'Study Room',
        reservationDate: bookingData.date,
        startTime: bookingData.startTime,
        endTime,
        purpose: bookingData.purpose,
        userName: bookingData.userName,
        duration: bookingData.duration,
        status: 'Confirmed'
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
        setBookingData({
          date: new Date().toISOString().split('T')[0],
          startTime: '', endTime: '', purpose: '', duration: '', userName: ''
        });
      }, 2000);
    } catch (err) {
      setBookingError('Booking failed. Please try again.');
    }
  };

  const openBookingModal = (room) => {
    setActiveTab('rooms');
    setSelectedRoom(room);
    setBookingError('');
    setShowBookingModal(true);
  };

  useEffect(() => {
    if (!showBookingModal) return;
    if (!bookingPanelRef.current) return;
    bookingPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showBookingModal, selectedRoom?.id]);

  return (
    <div className="min-h-screen bg-god-glass p-4 md:p-10 font-sans">
      <style>{styles}</style>

      {/* HERO HEADER */}
      <header className="max-w-7xl mx-auto mb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-700 px-6 py-2 rounded-full text-sm font-black tracking-widest uppercase mb-8">
          <Zap size={16} className="ai-pulse" />
          Premium Study Spaces
        </div>

        <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight mb-6">
          Your Perfect <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Study Zone</span>
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Reserve premium study spaces and library seats designed for productivity, collaboration, and focused learning.
        </p>

        {/* TABS */}
        <div className="flex justify-center gap-4 mb-12">
          <Button variant={activeTab === 'rooms' ? 'primary' : 'secondary'} onClick={() => setActiveTab('rooms')}>
            Study Rooms
          </Button>
          <Button variant={activeTab === 'seats' ? 'primary' : 'secondary'} onClick={() => setActiveTab('seats')}>
            Seat Reservation
          </Button>
        </div>

        {activeTab === 'rooms' && (
          <>
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
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search room, building, description..."
                  className="w-full bg-transparent outline-none text-slate-700" />
              </div>
              <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} className="premium-card p-3 text-slate-700 outline-none">
                <option value="all">All Availability</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={capacityFilter} onChange={(e) => setCapacityFilter(e.target.value)} className="premium-card p-3 text-slate-700 outline-none">
                  <option value="all">Any capacity</option>
                  <option value="1">1 Person</option>
                  <option value="2-4">2–4 People</option>
                  <option value="5+">5+ People</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="premium-card p-3 text-slate-700 outline-none">
                  <option value="recommended">Recommended</option>
                  <option value="capacity">Capacity</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>
          </>
        )}
      </header>

      {activeTab === 'seats' && <SeatReservation />}

      {activeTab === 'rooms' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {loadingRooms ? (
            <div className="col-span-full text-center py-20">
              <Zap size={48} className="mx-auto text-emerald-500 ai-pulse mb-4" />
              <p className="text-slate-500 font-bold">Loading premium spaces...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="premium-card p-12 text-center col-span-full">
              <p className="text-slate-500 font-bold">No rooms found matching your criteria.</p>
            </div>
          ) : (
            filteredRooms.map((room, index) => (
              <React.Fragment key={room.id}>
                <div className="premium-card group rounded-3xl overflow-hidden"
                  style={{ animation: `fadeInUp 0.6s ease-out forwards ${index * 0.1}s`, opacity: 0 }}>
                  <div className="image-container relative h-48 overflow-hidden">
                    <img src={room.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={room.name} />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold backdrop-blur-md border ${room.availability === 'Available'
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
                    {room.description && <p className="text-sm text-slate-600 mb-4 line-clamp-2">{room.description}</p>}

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

                    {(() => {
                      const roomBookings = roomReservations.filter(res =>
                        res.studyRoomId === room.id || res.studyRoomId?._id === room.id
                      );
                      return roomBookings.length > 0 ? (
                        <div className="space-y-1.5 mb-5">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-px flex-1 bg-slate-100"></div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Schedule</div>
                            <div className="h-px flex-1 bg-slate-100"></div>
                          </div>
                          {roomBookings.map((res, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-emerald-50/70 rounded-xl border border-emerald-100/50 text-[11px] animate-in slide-in-from-bottom-1 fade-in duration-300">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {res.userName || 'Student'}
                              </div>
                              <span className="font-black text-emerald-600 bg-white px-2 py-0.5 rounded-lg border border-emerald-100 shadow-sm">
                                {res.startTime} - {res.endTime}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}

                    <Button variant="primary" size="lg" className="w-full mt-2"
                      onClick={() => openBookingModal(room)}
                      disabled={room.availability === 'Busy'}>
                      {room.availability === 'Available' ? 'Reserve Now' : 'Unavailable'}
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                </div>

                {showBookingModal && selectedRoom?.id === room.id && (
                  <div ref={bookingPanelRef} className="col-span-full">
                    <div className="max-w-4xl mx-auto">
                      <div className="booking-modal rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
                        <div className="p-4 md:p-5 border-b border-white/60 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-black text-blue-700 bg-blue-500/20 inline-flex px-4 py-2 rounded-full uppercase tracking-widest">
                            Study Room Booking
                          </div>
                          <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-3">Reserve {selectedRoom?.name}</h3>
                          <p className="text-sm text-slate-600 mt-1">Free Reservation • {selectedRoom?.type}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowBookingModal(false);
                            setBookingError('');
                            setBookingSuccess(false);
                          }}
                          className="p-3 rounded-2xl border border-slate-200 bg-white/70 hover:bg-white transition-colors"
                          aria-label="Close booking form"
                        >
                          <X size={20} className="text-slate-700" />
                        </button>
                        </div>

                        {bookingSuccess ? (
                        <div className="p-10 text-center animate-in zoom-in duration-300">
                          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200/40">
                            <Check size={38} className="text-white" />
                          </div>
                          <h3 className="text-3xl font-black text-slate-900 mb-2">Booking Confirmed!</h3>
                          <p className="text-slate-600">Your study room has been successfully reserved.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleBooking} className="p-5 md:p-8 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              <label htmlFor="sr-userName" className="block text-sm font-bold text-slate-700 mb-2">Student Name</label>
                              <input
                                id="sr-userName"
                                type="text"
                                required
                                placeholder="Enter student name"
                                value={bookingData.userName}
                                onChange={(e) => setBookingData(prev => ({ ...prev, userName: e.target.value }))}
                                className="glass-input w-full px-4 py-3 rounded-2xl outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label htmlFor="sr-date" className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                              <input
                                id="sr-date"
                                type="date"
                                required
                                value={bookingData.date}
                                onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                                className="glass-input w-full px-4 py-3 rounded-2xl outline-none transition-all"
                              />
                            </div>

                            <div>
                              <label htmlFor="sr-duration" className="block text-sm font-bold text-slate-700 mb-2">Duration</label>
                              <select
                                id="sr-duration"
                                required
                                value={bookingData.duration}
                                onChange={(e) => setBookingData(prev => ({ ...prev, duration: e.target.value }))}
                                className="glass-input w-full px-4 py-3 rounded-2xl outline-none transition-all"
                              >
                                <option value="">Select</option>
                                <option value="1h">1 Hour</option>
                                <option value="2h">2 Hours</option>
                                <option value="3h">3 Hours</option>
                                <option value="4h">4 Hours</option>
                                <option value="full">Full Day</option>
                              </select>
                            </div>

                            <div>
                              <label htmlFor="sr-startTime" className="block text-sm font-bold text-slate-700 mb-2">Start Time</label>
                              <select
                                id="sr-startTime"
                                required
                                value={bookingData.startTime}
                                onChange={(e) => setBookingData(prev => ({ ...prev, startTime: e.target.value }))}
                                className="glass-input w-full px-4 py-3 rounded-2xl outline-none transition-all"
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

                            <div className="md:col-span-2">
                              <label htmlFor="sr-purpose" className="block text-sm font-bold text-slate-700 mb-2">Purpose</label>
                              <select
                                id="sr-purpose"
                                required
                                value={bookingData.purpose}
                                onChange={(e) => setBookingData(prev => ({ ...prev, purpose: e.target.value }))}
                                className="glass-input w-full px-4 py-3 rounded-2xl outline-none transition-all"
                              >
                                <option value="">Select</option>
                                <option value="study">Study</option>
                                <option value="meeting">Meeting</option>
                                <option value="project">Project Work</option>
                                <option value="research">Research</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                              type="button"
                              variant="secondary"
                              className="flex-1"
                              onClick={() => {
                                setShowBookingModal(false);
                                setBookingError('');
                                setBookingSuccess(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" variant="primary" className="flex-1">
                              Confirm
                              <Check size={18} />
                            </Button>
                          </div>

                          {bookingError && (
                            <div className="text-center text-sm font-bold text-red-600">
                              {bookingError}
                            </div>
                          )}
                        </form>
                      )}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          )}
        </div>
      )}
    </div>
  );
}
