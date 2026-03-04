import React from 'react';
import { Target, MessageCircle, Users, Zap, Shield, Heart } from 'lucide-react';

export default function AboutUs() {
    const team = [
        { name: 'Innovation Team', role: 'Core Developers', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80' },
        { name: 'Design Studio', role: 'UX/UI Designers', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80' },
        { name: 'Campus Support', role: 'Customer Success', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80' },
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative pb-32 pt-16 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1541339907198-e08759df9a13?auto=format&fit=crop&w=1600&q=80"
                        alt="Campus"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900"></div>
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h1 className="text-5xl md:text-8xl font-black mb-8 animate-fadeIn tracking-tight">
                        Redefining <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            Campus Experience
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
                        CampusCore is more than just a management system. It's an ecosystem built to empower students
                        and streamline campus life through innovation and technology.
                    </p>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: 'Active Students', value: '10,000+' },
                            { label: 'Campus Modules', value: '15+' },
                            { label: 'Daily Activity', value: '50k+' },
                            { label: 'Satisfaction Rate', value: '98%' },
                        ].map((stat, idx) => (
                            <div key={idx} className="text-center p-8 rounded-3xl bg-slate-50 border border-slate-100">
                                <div className="text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
                                <div className="text-slate-500 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-bold mb-8">Our Mission & Values</h2>
                            <div className="space-y-8">
                                {[
                                    { icon: Target, title: 'Student-First Innovation', desc: 'We build features that solve real problems students face every day.' },
                                    { icon: Shield, title: 'Trust & Security', desc: 'Your data is protected by enterprise-grade security protocols.' },
                                    { icon: Zap, title: 'Speed & Efficiency', desc: 'Optimized performance to ensure you get things done faster.' },
                                    { icon: Heart, title: 'Community Focused', desc: 'Fostering connections between students, faculty, and campus clubs.' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">
                                            <item.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                            <p className="text-slate-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                                    alt="Team collaboration"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-8 -left-8 bg-blue-600 text-white p-8 rounded-[2rem] shadow-xl max-w-xs">
                                <MessageCircle size={32} className="mb-4" />
                                <p className="text-lg font-medium italic">"CampusCore changed how we interact with our college services completely."</p>
                                <div className="mt-4 font-bold">- Student Council President</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-16">The Minds Behind CampusCore</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {team.map((member, idx) => (
                            <div key={idx} className="group flex flex-col items-center">
                                <div className="w-48 h-48 rounded-full overflow-hidden mb-6 ring-4 ring-slate-100 group-hover:ring-blue-100 transition-all duration-300">
                                    <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{member.name}</h3>
                                <p className="text-slate-500">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
