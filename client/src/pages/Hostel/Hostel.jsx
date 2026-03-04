import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  FileText,
  MapPin,
  History,
  Settings,
  AlertCircle,
  Menu,
  X,
  Loader,
  CheckCircle,
} from 'lucide-react';
import { hostelService } from '../../services/hostelService';
import Complaints from './Complaints';

export default function Hostel({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    studentId: user?.studentId || '',
    studentName: user?.name || '',
    homeAddress: '',
    district: '',
    roomType: '',
    preferredFloor: '',
    additionalInfo: '',
  });

  const roomTypeOptions = ['Single Room (1 person)', 'Double Room (2 persons)'];
  const floorOptions = ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor'];
  const sriLankanDistricts = [
    'Colombo', 'Gampaha', 'Kalutara',
    'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota',
    'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu',
    'Batticaloa', 'Ampara', 'Trincomalee',
    'Kurunegala', 'Puttalam',
    'Anuradhapura', 'Polonnaruwa',
    'Badulla', 'Monaragala',
    'Ratnapura', 'Kegalle'
  ];

  const pollIntervalRef = useRef(null);

  // Check application status on load and set up polling
  useEffect(() => {
    checkApplicationStatus();

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user]);

  const checkApplicationStatus = async () => {
    try {
      setLoading(true);
      const application = await hostelService.getMyApplication();
      if (application) {
        setApplicationStatus(application.status);

        // If pending, set up polling
        if (application.status === 'pending') {
          setupPolling();
        } else {
          // Stop polling if status is no longer pending
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } else {
        setApplicationStatus('none');
        // Stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setApplicationStatus('none');
    } finally {
      setLoading(false);
    }
  };

  const setupPolling = () => {
    // Clear existing interval if any
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Set up new polling interval
    pollIntervalRef.current = setInterval(async () => {
      try {
        const application = await hostelService.getMyApplication();
        if (application) {
          setApplicationStatus(application.status);
          // Clear interval when status changes from pending
          if (application.status !== 'pending') {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return (
      formData.studentId &&
      formData.studentName &&
      formData.homeAddress &&
      formData.district &&
      formData.preferredFloor &&
      agreedToTerms
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!isFormValid()) {
      setFormError('Please fill in all required fields and agree to the terms');
      return;
    }

    setFormSubmitting(true);

    try {
      const response = await hostelService.applyForHostel(formData);
      console.log('Application submitted:', response);
      setFormSuccess(true);
      setTimeout(() => {
        setApplicationStatus('pending');
        setFormSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Form submission error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit application';
      setFormError(errorMessage);
    } finally {
      setFormSubmitting(false);
    }
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      description: 'View your hostel details',
      onClick: () => { navigate('/hostel'); setActiveTab('dashboard'); },
    },
    {
      icon: FileText,
      label: 'Apply for Hostel',
      description: 'Submit hostel application',
      onClick: () => { navigate('/hostel'); setActiveTab('dashboard'); },
    },
    {
      icon: MapPin,
      label: 'Room Details',
      description: 'View your room information',
      onClick: () => { },
    },
    {
      icon: History,
      label: 'Booking History',
      description: 'View past bookings',
      onClick: () => { },
    },
    {
      icon: AlertCircle,
      label: 'Complaints',
      description: 'Report issues',
      onClick: () => setActiveTab('complaints'),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-gray-700 font-medium">Loading hostel portal...</p>
        </div>
      </div>
    );
  }

  // No application - show form
  if (applicationStatus === 'none') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
              <span className="font-medium text-gray-800">Back</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900">Hostel Application Form</h1>
              <p className="text-sm text-gray-500 mt-2">Submit your application to apply for hostel accommodation</p>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{formError}</p>
                </div>
              )}

              {formSuccess && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-green-800 text-sm">Application submitted successfully! Redirecting...</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student ID *</label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    placeholder="Enter your student ID"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student Name *</label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Home Address *</label>
                <input
                  type="text"
                  name="homeAddress"
                  value={formData.homeAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your home address"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select your district</option>
                  {sriLankanDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Room Type *</label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a room type</option>
                  {roomTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Floor *</label>
                <select
                  name="preferredFloor"
                  value={formData.preferredFloor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a floor</option>
                  {floorOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="Any additional information or special requests (optional)"
                  rows="4"
                  className="w-full px-4 py-2 text-gray-700 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-600"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 rounded border-gray-300 text-blue-600 bg:color-white focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the hostel{' '}
                  <button
                    type="button"
                    className="text-blue-600  hover:underline"
                    onClick={() => navigate('/hostel/terms')}
                  >
                    terms and conditions
                  </button>{' '}*
                </label>
              </div>

              <button
                type="submit"
                disabled={formSubmitting || formSuccess || !isFormValid()}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {formSubmitting ? 'Submitting...' : formSuccess ? 'Application Submitted' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Pending state
  if (applicationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg max-w-md text-center">
          <div className="p-3 bg-yellow-50 rounded-lg w-fit mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Pending</h2>
          <p className="text-gray-600 mb-2">Your hostel application is under review.</p>
          <p className="text-sm text-gray-500 mb-6">We're automatically checking for updates every 5 seconds.</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={checkApplicationStatus}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Refresh Now
            </button>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rejected state
  if (applicationStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg max-w-md text-center">
          <div className="p-3 bg-red-50 rounded-lg w-fit mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Rejected</h2>
          <p className="text-gray-600 mb-6">Unfortunately, your hostel application was not approved. Contact the administration for details.</p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Approved - show dashboard with sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 md:translate-x-0 md:static`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Home className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Hostel</h1>
                  <p className="text-xs text-gray-500">Student Module</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.onClick();
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <item.icon className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Settings */}
            <div className="p-4 border-t border-gray-200 space-y-2">
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                className="md:hidden inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <X className="h-4 w-4 text-gray-700" />
                ) : (
                  <Menu className="h-4 w-4 text-gray-700" />
                )}
              </button>

              <button
                type="button"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
                <span className="font-medium text-gray-800">Back</span>
              </button>
            </div>

            {/* Page Content */}
            {activeTab === 'dashboard' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Home className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hostel Dashboard</h1>
                    <p className="text-sm text-gray-500">Welcome to your hostel portal</p>
                  </div>
                </div>

                <div className="p-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-1">1</div>
                      <div className="text-sm text-gray-600">Room Assigned</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 mb-1">Active</div>
                      <div className="text-sm text-gray-600">Status</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-600 mb-1">Month</div>
                      <div className="text-sm text-gray-600">Package Duration</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600 mb-1">₹5,000</div>
                      <div className="text-sm text-gray-600">Monthly Rent</div>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Room Details</h2>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room Number:</span>
                        <span className="font-medium text-gray-900">A-101</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Floor:</span>
                        <span className="font-medium text-gray-900">1st Floor</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room Type:</span>
                        <span className="font-medium text-gray-900">Double Room</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Occupants:</span>
                        <span className="font-medium text-gray-900">2 persons</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Bookings */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Notifications</h2>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-blue-900">Room Assignment Confirmed</div>
                          <div className="text-xs text-blue-700">Your room has been assigned for this semester</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'complaints' && (
              <Complaints user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
