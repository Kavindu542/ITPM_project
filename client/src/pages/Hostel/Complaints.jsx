import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Send, Paperclip } from 'lucide-react';
import { hostelService } from '../../services/hostelService';

export default function Complaints({ user }) {
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        description: '',
        urgency: 'medium',
    });

    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formSuccess, setFormSuccess] = useState(false);
    const [formError, setFormError] = useState('');

    const categories = [
        'Plumbing',
        'Electrical',
        'Cleaning & Hygiene',
        'Furniture Damage',
        'Internet / Wi-Fi',
        'Noise or Disruption',
        'Food Issue',
        'Other'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!formData.subject || !formData.category || !formData.description) {
            setFormError('Please fill in all required fields.');
            return;
        }

        setFormSubmitting(true);

        try {
            await hostelService.submitComplaint(formData);

            setFormSuccess(true);
            setFormData({
                subject: '',
                category: '',
                description: '',
                urgency: 'medium',
            });

            setTimeout(() => {
                setFormSuccess(false);
            }, 4000);

        } catch (error) {
            setFormError(error?.message || 'Failed to submit complaint. Please try again.');
        } finally {
            setFormSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Lodge a Complaint</h2>
                <p className="text-gray-600">Please provide details about the issue you are facing in the hostel.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Complaint Form</h3>
                        <p className="text-sm text-gray-500 mt-1">All fields marked with * are mandatory</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {formError && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-red-800 text-sm">{formError}</p>
                        </div>
                    )}

                    {formSuccess && (
                        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-green-800 text-sm">Complaint submitted successfully! Our team will look into it shortly.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                placeholder="Brief title of the issue"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                        <div className="flex gap-4">
                            {['low', 'medium', 'high', 'critical'].map((urgency) => (
                                <label key={urgency} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="urgency"
                                        value={urgency}
                                        checked={formData.urgency === urgency}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 capitalize">{urgency}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Provide as much detail as possible to help us resolve the issue quickly..."
                            rows="5"
                            className="w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            onClick={() => {
                                setFormData({
                                    subject: '',
                                    category: '',
                                    description: '',
                                    urgency: 'medium',
                                });
                                setFormError('');
                            }}
                        >
                            Clear
                        </button>
                        <button
                            type="submit"
                            disabled={formSubmitting || formSuccess}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            {formSubmitting ? 'Submitting...' : 'Submit Complaint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
