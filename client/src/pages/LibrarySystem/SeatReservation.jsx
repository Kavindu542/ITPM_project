import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Check, X } from 'lucide-react';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const SEATS = Array.from({ length: 40 }, (_, i) => ({
    id: `seat-${i + 1}`,
    number: i + 1,
}));

export default function SeatReservation() {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [reservations, setReservations] = useState([]);
    const [myReservations, setMyReservations] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ startTime: '', endTime: '', purpose: '', userName: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSeatAvailability();
        fetchMyReservations();
    }, [date]);

    const fetchSeatAvailability = async () => {
        try {
            const res = await api.get(`/library/reservations/seat-availability?date=${date}`);
            if (res.data.success) {
                setReservations(res.data.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMyReservations = async () => {
        try {
            const res = await api.get('/library/reservations/my-reservations?type=Seat');
            if (res.data.success) {
                setMyReservations(res.data.data.reservations || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSeatClick = (seat) => {
        const isBooked = reservations.some(r => r.seatNumber === String(seat.number));
        if (isBooked) return;
        setSelectedSeat(seat);
        setShowModal(true);
    };

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/library/reservations', {
                type: 'Seat',
                seatNumber: selectedSeat.number,
                refName: `Seat ${selectedSeat.number}`,
                reservationDate: date,
                startTime: formData.startTime,
                endTime: formData.endTime,
                purpose: formData.purpose,
                userName: formData.userName,
                status: 'Confirmed'
            });
            setShowModal(false);
            fetchSeatAvailability();
            fetchMyReservations();
            alert('Seat booked successfully!');
        } catch (err) {
            alert('Failed to book seat: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
        try {
            await api.delete(`/library/reservations/my-reservations/${id}`);
            fetchSeatAvailability();
            fetchMyReservations();
        } catch (err) {
            alert('Failed to cancel reservation');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10">
            <div className="text-center">
                <h2 className="text-4xl font-black text-slate-800 mb-4">Library Seat Reservation</h2>
                <div className="flex justify-center items-center gap-4 mb-8">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex flex-wrap justify-center gap-6 mb-8 text-xs font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div> Available
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200"></div> Booked
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200"></div> Your Seat
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div> Selected
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-4xl mx-auto">
                <div className="grid grid-cols-5 md:grid-cols-8 gap-4">
                    {SEATS.map((seat) => {
                        const booking = reservations.find(r => r.seatNumber === String(seat.number));
                        const isMine = myReservations.some(r => r.seatNumber === String(seat.number) &&
                            new Date(r.reservationDate).toISOString().split('T')[0] === date);
                        const isBooked = !!booking;
                        const isSelected = selectedSeat?.id === seat.id;

                        let bgClass = "bg-emerald-500 hover:bg-emerald-400 cursor-pointer shadow-emerald-100";
                        if (isBooked) bgClass = "bg-red-500 cursor-help shadow-red-100";
                        if (isMine) bgClass = "bg-indigo-600 cursor-help shadow-indigo-100 scale-105 z-10 ring-4 ring-indigo-50";
                        if (isSelected) bgClass = "bg-blue-500 ring-4 ring-blue-50 z-20 scale-110";

                        return (
                            <div
                                key={seat.id}
                                className={`group relative aspect-square flex flex-col items-center justify-center rounded-2xl text-white font-black text-lg shadow-lg transition-all duration-300 ${bgClass}`}
                                onClick={() => handleSeatClick(seat)}
                            >
                                {seat.number}
                                {isMine && (
                                    <span className="absolute -top-2 -right-1 bg-amber-400 text-slate-900 text-[10px] px-2 py-0.5 rounded-full shadow-md font-black border-2 border-white animate-bounce">YOU</span>
                                )}

                                {isBooked && !isSelected && (
                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-40 p-3 bg-slate-900/95 backdrop-blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 pointer-events-none text-center shadow-2xl border border-white/20 translate-y-2 group-hover:translate-y-0">
                                        <div className={`font-black text-[10px] mb-2 tracking-widest uppercase py-1 rounded-lg ${isMine ? 'bg-indigo-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {isMine ? '🏷️ Your Booking' : '🔒 Reserved'}
                                        </div>
                                        <div className="font-bold text-white text-xs mb-1 truncate px-1">
                                            {booking.userName || 'Student'}
                                        </div>
                                        <div className="text-slate-400 font-bold text-[10px] bg-white/5 py-1 rounded-lg flex items-center justify-center gap-1">
                                            <Clock size={10} /> {booking.startTime} - {booking.endTime}
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {myReservations.length > 0 && (
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-4xl mx-auto border border-indigo-50">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Check size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">My Reservations</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Active Seats</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myReservations.map(res => (
                            <div key={res._id} className="group flex justify-between items-center p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {res.seatNumber}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800">Seat Reservation</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg uppercase">
                                                {new Date(res.reservationDate).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] font-black bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg uppercase">
                                                {res.startTime} - {res.endTime}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteBooking(res._id)}
                                    className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm group-hover:animate-in zoom-in-75 duration-300"
                                    title="Cancel Reservation"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black">Book Seat {selectedSeat?.number}</h3>
                            <button onClick={() => setShowModal(false)}><X size={24} className="text-slate-500 hover:text-red-500" /></button>
                        </div>
                        <form onSubmit={handleBookSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">From</label>
                                    <input type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">To</label>
                                    <input type="time" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                                <input type="text" placeholder="Enter your name" required value={formData.userName} onChange={e => setFormData({ ...formData, userName: e.target.value })} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-emerald-500 font-bold" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Purpose</label>
                                <input type="text" placeholder="Study, Assignment, etc." required value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} className="w-full border rounded-xl px-4 py-2 outline-none focus:border-emerald-500" />
                            </div>
                            <button disabled={loading} type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg transition-colors">
                                {loading ? 'Booking...' : 'Confirm Reservation'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
