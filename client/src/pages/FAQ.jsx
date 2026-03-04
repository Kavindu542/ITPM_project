import React, { useState } from 'react';
import { Plus, Minus, Search, HelpCircle } from 'lucide-react';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            category: 'General',
            question: 'What is CampusCore?',
            answer: "CampusCore is a unified platform designed to manage various aspects of campus life, including study materials, library services, hostel management, and club activities, all in one modern interface."
        },
        {
            category: 'Account',
            question: 'How do I reset my password?',
            answer: "You can reset your password by clicking 'Forgot Password?' on the login screen. You'll receive an email with instructions to create a new secure password."
        },
        {
            category: 'Modules',
            question: 'Where can I find my course materials?',
            answer: "All course-related resources are available in the 'Study Material' module. You can browse by department or search for specific document titles."
        },
        {
            category: 'Modules',
            question: 'How do I book a study room in the library?',
            answer: "Navigate to the 'Library' module, select 'Study Rooms', check for availability, and click 'Reserve' for your preferred time slot."
        },
        {
            category: 'Hostel',
            question: 'How do I report a maintenance issue in my hostel?',
            answer: "In the 'Hostel' portal, navigate to the 'Complaints' section and submit a new request. You can track the status of your complaint in real-time."
        },
        {
            category: 'Clubs',
            question: 'Can I join multiple clubs?',
            answer: "Yes, you can join as many clubs as you're interested in through the 'Clubs & Societies' module. We encourage diverse participation in campus life!"
        }
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Hero Section (match About Us hero style) */}
            <section className="relative pb-20 pt-12 overflow-hidden bg-slate-900 text-white">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1600&q=80"
                        alt="FAQ"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900"></div>
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 mb-6 backdrop-blur-md border border-white/20">
                        <HelpCircle size={18} />
                        <span className="text-sm font-semibold text-slate-200">Help Center</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight">
                        Need <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                            Answers?
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium mb-8">
                        Everything you need to know about using CampusCore and navigating your university life.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-3xl mx-auto">
                        <Search className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 text-slate-400" size={26} />
                        <input
                            type="text"
                            placeholder="Search for questions, keywords..."
                            className="w-full pl-16 sm:pl-20 pr-6 sm:pr-8 py-4 sm:py-5 rounded-[2rem] text-slate-900 shadow-2xl bg-white/95 backdrop-blur focus:ring-8 focus:ring-emerald-400/20 outline-none transition-all text-lg sm:text-xl font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-6 mt-16 max-w-4xl">
                <div className="space-y-4">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${openIndex === idx ? 'border-blue-400 shadow-xl shadow-blue-500/5' : 'border-slate-100 shadow-sm'
                                    }`}
                            >
                                <button
                                    className="w-full px-10 py-8 flex items-center justify-between text-left group"
                                    onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{faq.category}</span>
                                        <span className={`text-xl font-bold transition-colors ${openIndex === idx ? 'text-blue-700' : 'text-slate-900'}`}>
                                            {faq.question}
                                        </span>
                                    </div>
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${openIndex === idx ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                        }`}>
                                        {openIndex === idx ? <Minus size={20} /> : <Plus size={20} />}
                                    </div>
                                </button>
                                <div
                                    className={`transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="px-10 pb-10 pt-2 text-slate-600 text-lg leading-relaxed">
                                        <div className="h-[2px] w-12 bg-blue-100 mb-8 rounded-full"></div>
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-100">
                            <div className="text-6xl mb-6">🔍</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">No results found</h3>
                            <p className="text-slate-500">We couldn't find any questions matching your search. Please try different keywords.</p>
                        </div>
                    )}
                </div>

                {/* Still Have Questions */}
                <div className="mt-16 bg-gradient-to-r from-blue-100 to-indigo-600 rounded-[2.5rem] p-12 text-center text-white shadow-2xl shadow-blue-500/20">
                    <h3 className="text-3xl font-bold mb-4">Still have questions?</h3>
                    <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto">
                        If you couldn't find an answer in our FAQ, our dedicated support team is always ready to assist you.
                    </p>
                    <a
                        href="/contact"
                        className="inline-flex items-center gap-2 px-10 py-5 bg-blue text-black-600 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-lg"
                    >
                        Contact Support Team
                    </a>
                </div>
            </div>
        </div>
    );
}
