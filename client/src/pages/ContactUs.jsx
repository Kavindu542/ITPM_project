import React from 'react';
import { Mail, Phone, MapPin, Send, Instagram, Twitter, Linkedin } from 'lucide-react';

export default function ContactUs() {
    const [submitted, setSubmitted] = React.useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="relative bg-slate-900 text-white pb-32 pt-16 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80"
                        alt="Contact"
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                </div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter">Get in <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Touch</span></h1>
                    <p className="text-slate-300 text-xl md:text-2xl max-w-2xl mx-auto font-medium">
                        Have questions about CampusCore? We're here to help. Reach out to our
                        support team or visit us at our main office.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        {[
                            { icon: Mail, title: 'Email Us', info: 'support@campuscore.edu', color: 'bg-blue-500' },
                            { icon: Phone, title: 'Call Center', info: '+1 (234) 567-8900', color: 'bg-emerald-500' },
                            { icon: MapPin, title: 'Main Office', info: 'University Admin Block, Building 4', color: 'bg-indigo-500' },
                        ].map((card, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                                <div className={`h-14 w-14 rounded-2xl ${card.color} text-white flex items-center justify-center mb-6`}>
                                    <card.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                                <p className="text-slate-600">{card.info}</p>
                            </div>
                        ))}

                        {/* Social Links */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                            <h3 className="text-xl font-bold mb-8">Follow Our Updates</h3>
                            <div className="flex justify-center gap-6">
                                {[Instagram, Twitter, Linkedin].map((Icon, idx) => (
                                    <button key={idx} className="h-12 w-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Icon size={24} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-10 lg:p-16 rounded-[2.5rem] shadow-xl border border-slate-100">
                            <h2 className="text-3xl font-bold mb-8">Send us a Message</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50"
                                            placeholder="Jane"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50"
                                        placeholder="jane@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                                    <select className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50">
                                        <option>General Inquiry</option>
                                        <option>Technical Support</option>
                                        <option>Module Specific Question</option>
                                        <option>Feedback</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                                    <textarea
                                        rows="6"
                                        required
                                        className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-slate-50 resize-none"
                                        placeholder="Tell us how we can help..."
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
                                >
                                    <Send size={20} />
                                    Send Message
                                </button>
                            </form>

                            {submitted && (
                                <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-center animate-bounce">
                                    <span className="font-bold text-lg">Thank you! Your message has been sent successfully.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Map Placeholder */}
                <div className="mt-16 rounded-[2.5rem] overflow-hidden shadow-2xl h-[400px] relative">
                    <img
                        src="https://images.unsplash.com/photo-1524660988544-147921090ee2?auto=format&fit=crop&w=1600&q=80"
                        alt="Campus Map"
                        className="w-full h-full object-cover grayscale opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/80 backdrop-blur-md px-12 py-8 rounded-[2rem] shadow-xl text-center border border-white/40">
                            <MapPin className="mx-auto text-blue-600 mb-4" size={40} />
                            <h4 className="text-2xl font-bold text-slate-900">Academic Block Center</h4>
                            <p className="text-slate-600">Main University Campus, Central Square</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
