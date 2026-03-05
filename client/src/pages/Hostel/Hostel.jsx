import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  FileText,
  MapPin,
  History,
  AlertCircle,
  Menu,
  X,
  Loader,
  CheckCircle,
  Shirt,
  Store,
  Phone,
  Clock3,
  Truck,
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
  const [laundryShops, setLaundryShops] = useState([]);
  const [laundryLoading, setLaundryLoading] = useState(false);
  const [laundryError, setLaundryError] = useState('');
  const [laundryBookings, setLaundryBookings] = useState([]);
  const [laundryBookingLoading, setLaundryBookingLoading] = useState(false);
  const [mealShopProfile, setMealShopProfile] = useState(null);
  const [selectedMealItems, setSelectedMealItems] = useState([]);
  const [mealItemQuantities, setMealItemQuantities] = useState({});
  const [mealOrderMessage, setMealOrderMessage] = useState('');
  const [mealOrderModalOpen, setMealOrderModalOpen] = useState(false);
  const [mealOrderSubmitting, setMealOrderSubmitting] = useState(false);
  const [mealOrderForm, setMealOrderForm] = useState({
    studentName: '',
    contactNumber: '',
    floor: '',
    roomNumber: '',
    notes: '',
  });
  const [selectedShop, setSelectedShop] = useState(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [expandedShopId, setExpandedShopId] = useState('');
  const [bookingForm, setBookingForm] = useState({
    studentName: '',
    contactNumber: '',
    floor: '',
    roomNumber: '',
    serviceType: 'washing',
    notes: '',
  });
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

  useEffect(() => {
    if (applicationStatus !== 'approved') return;
    if (!['dashboard', 'laundry', 'laundry-bookings'].includes(activeTab)) return;

    loadLaundryShops();
    loadMyLaundryBookings();
  }, [activeTab, applicationStatus]);

  useEffect(() => {
    if (activeTab !== 'meal-shop') return;
    loadMealShopProfile();
  }, [activeTab]);

  const checkApplicationStatus = async () => {
    try {
      setLoading(true);
      const application = await hostelService.getMyApplication();
      if (application) {
        setApplicationStatus(application.status);

        // If pending, set up polling
        if (application.status === 'pending') {
          setupPolling();
        } else if (application.status === 'approved') {
          loadLaundryShops();
          loadMyLaundryBookings();
          loadMealShopProfile();
        } else {
          // Stop polling if status is no longer pending
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } else {
        setApplicationStatus('none');
        setLaundryShops([]);
        setLaundryBookings([]);
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

  const loadLaundryShops = async () => {
    try {
      setLaundryLoading(true);
      setLaundryError('');
      const data = await hostelService.getLaundryShops();
      setLaundryShops(Array.isArray(data) ? data : []);
    } catch (err) {
      setLaundryError(err?.message || 'Failed to load laundry shops');
    } finally {
      setLaundryLoading(false);
    }
  };

  const loadMyLaundryBookings = async () => {
    try {
      setLaundryBookingLoading(true);
      const data = await hostelService.getMyLaundryBookings();
      setLaundryBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load laundry bookings', err);
    } finally {
      setLaundryBookingLoading(false);
    }
  };

  const loadMealShopProfile = () => {
    try {
      const raw = localStorage.getItem('hostelMealShopProfile');
      if (!raw) {
        setMealShopProfile(null);
        setSelectedMealItems([]);
        setMealItemQuantities({});
        setMealOrderMessage('');
        return;
      }
      const parsed = JSON.parse(raw);
      setMealShopProfile(parsed && typeof parsed === 'object' ? parsed : null);
      setSelectedMealItems([]);
      setMealItemQuantities({});
      setMealOrderMessage('');
    } catch (err) {
      console.error('Failed to load meal shop profile', err);
      setMealShopProfile(null);
      setSelectedMealItems([]);
      setMealItemQuantities({});
      setMealOrderMessage('');
    }
  };

  const formatTimeValue = (value) => {
    if (!value || typeof value !== 'string' || !value.includes(':')) return 'Not specified';
    const [hh, mm] = value.split(':');
    const h = Number(hh);
    if (Number.isNaN(h)) return value;
    const meridiem = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${mm} ${meridiem}`;
  };

  const mealMenuItems = React.useMemo(() => {
    const rawItems = Array.isArray(mealShopProfile?.menuItems) ? mealShopProfile.menuItems : [];
    return rawItems
      .map((item, idx) => {
        const numericPrice = Number(item?.price);
        return {
          id: item?.id || `menu-${idx}`,
          name: String(item?.name || '').trim(),
          price: Number.isFinite(numericPrice) ? numericPrice : 0,
        };
      })
      .filter((item) => item.name);
  }, [mealShopProfile]);

  const selectedMealTotal = React.useMemo(() => {
    if (!mealMenuItems.length || !selectedMealItems.length) return 0;
    return mealMenuItems
      .filter((item) => selectedMealItems.includes(item.id))
      .reduce((sum, item) => {
        const qty = Math.max(1, Number(mealItemQuantities[item.id] || 1));
        return sum + (item.price * qty);
      }, 0);
  }, [mealMenuItems, selectedMealItems, mealItemQuantities]);

  const toggleMealItem = (itemId) => {
    setMealOrderMessage('');
    setSelectedMealItems((prev) => {
      const exists = prev.includes(itemId);
      if (exists) {
        return prev.filter((id) => id !== itemId);
      }
      setMealItemQuantities((prevQty) => ({ ...prevQty, [itemId]: Math.max(1, Number(prevQty[itemId] || 1)) }));
      return [...prev, itemId];
    });
  };

  const updateMealItemQty = (itemId, value) => {
    const qty = Math.max(1, Number(value) || 1);
    setMealItemQuantities((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleMealOrder = () => {
    if (selectedMealItems.length === 0) {
      setMealOrderMessage('Select at least one menu item to place the order.');
      return;
    }
    setMealOrderForm({
      studentName: user?.name || '',
      contactNumber: user?.contactNumber || '',
      floor: '',
      roomNumber: '',
      notes: '',
    });
    setMealOrderModalOpen(true);
  };

  const submitMealOrder = (e) => {
    e.preventDefault();
    if (selectedMealItems.length === 0) {
      setMealOrderMessage('Select at least one menu item to place the order.');
      setMealOrderModalOpen(false);
      return;
    }
    setMealOrderSubmitting(true);

    const orderedItems = mealMenuItems
      .filter((item) => selectedMealItems.includes(item.id))
      .map((item) => {
        const quantity = Math.max(1, Number(mealItemQuantities[item.id] || 1));
        return {
          name: item.name,
          price: item.price,
          quantity,
          lineTotal: item.price * quantity,
        };
      });

    const orderPayload = {
      id: `meal-order-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shopName: mealShopProfile?.shopName || 'Meal Shop',
      studentName: mealOrderForm.studentName || user?.name || 'Student',
      studentId: user?.studentId || '-',
      studentEmail: user?.email || '-',
      contactNumber: mealOrderForm.contactNumber || '-',
      floor: mealOrderForm.floor || '',
      roomNumber: mealOrderForm.roomNumber || '',
      notes: mealOrderForm.notes || '',
      items: orderedItems,
      totalPrice: selectedMealTotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem('hostelMealShopOrders');
      const existingOrders = raw ? JSON.parse(raw) : [];
      const safeOrders = Array.isArray(existingOrders) ? existingOrders : [];
      safeOrders.unshift(orderPayload);
      localStorage.setItem('hostelMealShopOrders', JSON.stringify(safeOrders));
      setMealOrderMessage(`Order created successfully. Total: Rs. ${selectedMealTotal.toFixed(2)}`);
      setSelectedMealItems([]);
      setMealItemQuantities({});
      setMealOrderModalOpen(false);
    } catch (err) {
      console.error('Failed to save meal order', err);
      setMealOrderMessage('Failed to place order. Please try again.');
    } finally {
      setMealOrderSubmitting(false);
    }
  };

  const openBooking = (shop) => {
    setSelectedShop(shop);
    setBookingForm({
      studentName: user?.name || '',
      contactNumber: user?.contactNumber || '',
      floor: '',
      roomNumber: '',
      serviceType: shop?.availableServices?.[0] || 'washing',
      notes: '',
    });
  };

  const submitLaundryBooking = async (e) => {
    e.preventDefault();
    if (!selectedShop?._id) return;
    setLaundryError('');
    setBookingSubmitting(true);
    try {
      await hostelService.createLaundryBooking({
        shopId: selectedShop._id,
        studentName: bookingForm.studentName,
        contactNumber: bookingForm.contactNumber,
        floor: bookingForm.floor,
        roomNumber: bookingForm.roomNumber,
        serviceType: bookingForm.serviceType,
        notes: bookingForm.notes,
      });
      setSelectedShop(null);
      await loadMyLaundryBookings();
    } catch (err) {
      setLaundryError(err?.message || 'Failed to create laundry booking');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const getLatestBookingForShop = (shopId) => {
    if (!shopId) return null;
    const relatedBookings = laundryBookings.filter((booking) => {
      const bookingShopId = booking?.shop?._id || booking?.shop;
      return String(bookingShopId || '') === String(shopId);
    });
    if (relatedBookings.length === 0) return null;
    return relatedBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  };

  const statusBadgeClass = (status) => {
    if (status === 'accepted') return 'bg-green-100 text-green-700';
    if (status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const statusLabel = (status) => (status === 'accepted' ? 'Approved' : String(status || 'Pending'));

  const readyBookings = React.useMemo(
    () => laundryBookings.filter((booking) => Boolean(booking?.ready)),
    [laundryBookings]
  );

  const renderLaundryCard = (shop, compact = false) => {
    const latestBooking = getLatestBookingForShop(shop._id);
    const services = Array.isArray(shop.availableServices) ? shop.availableServices : [];

    return (
      <div
        key={shop._id}
        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Your approval status</span>
          {latestBooking ? (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(latestBooking.status)}`}>
              {statusLabel(latestBooking.status)}
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">Not booked</span>
          )}
        </div>

        <div className="flex items-start gap-3">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className={`${compact ? 'h-14 w-14' : 'h-16 w-16'} rounded-xl object-cover border border-gray-200`}
            />
          ) : (
            <div className={`${compact ? 'h-14 w-14' : 'h-16 w-16'} rounded-xl bg-cyan-50 border border-cyan-100 grid place-items-center`}>
              <Shirt className={`${compact ? 'h-6 w-6' : 'h-7 w-7'} text-cyan-600`} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-gray-900`}>{shop.name}</h3>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 mt-0.5`}>{shop.location || 'Location not specified'}</p>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 mt-1 line-clamp-2`}>{shop.shortDescription || 'Laundry services available for hostel students.'}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {services.length > 0 ? services.map((service) => (
            <span key={service} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              {service === 'dry-cleaning' ? 'Dry Cleaning' : service.charAt(0).toUpperCase() + service.slice(1)}
            </span>
          )) : <span className="text-xs text-gray-500">No services listed</span>}
        </div>

        <div className={`${compact ? 'text-xs' : 'text-sm'} mt-3 space-y-1.5 text-gray-600`}>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {shop.contactNumber || '-'}</div>
          <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {shop.openingHours || 'Not specified'}</div>
          <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Pickup & Delivery: {shop.pickupDeliveryAvailable ? 'Yes' : 'No'}</div>
          <div className="font-semibold text-blue-700">{shop.priceInformation || 'Price not specified'}</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setExpandedShopId(expandedShopId === shop._id ? '' : shop._id)}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
          >
            View Details
          </button>
          <button
            type="button"
            onClick={() => openBooking(shop)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Book Laundry
          </button>
          <a
            href={`tel:${shop.contactNumber || ''}`}
            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
          >
            Contact
          </a>
        </div>

        {expandedShopId === shop._id && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
            <div><strong>Laundry Shop Name:</strong> {shop.name}</div>
            <div><strong>Location / Address:</strong> {shop.location || '-'}</div>
            <div><strong>Opening Hours:</strong> {shop.openingHours || '-'}</div>
            <div><strong>Price Information:</strong> {shop.priceInformation || '-'}</div>
            <div><strong>Short Description:</strong> {shop.shortDescription || '-'}</div>
          </div>
        )}
      </div>
    );
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
      icon: MapPin,
      label: 'Room Details',
      description: 'View your room information',
      onClick: () => setActiveTab('dashboard'),
    },
    {
      icon: Shirt,
      label: 'Laundry Services',
      description: 'View and book laundry services',
      onClick: () => setActiveTab('laundry'),
    },
    {
      icon: Store,
      label: 'Meal Shop',
      description: 'View meal shop services',
      onClick: () => setActiveTab('meal-shop'),
    },
    {
      icon: History,
      label: 'Booking History',
      description: 'View your laundry bookings',
      onClick: () => setActiveTab('laundry-bookings'),
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
            } fixed inset-y-0 left-0 z-50 w-30 bg-[#2458e6] shadow-xl transition-transform duration-300 md:translate-x-0 md:left-4 md:top-24 md:bottom-4 md:inset-y-auto md:rounded-[30px]`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-5 pb-3">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-white grid place-items-center shadow-sm">
                  <Home className="h-5 w-5 text-[#2458e6]" />
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav
              className="flex-1 p-4 space-y-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {menuItems.map((item, idx) => (
                (() => {
                  const isActive = (item.label === 'Dashboard' && activeTab === 'dashboard')
                    || (item.label === 'Laundry Services' && activeTab === 'laundry')
                    || (item.label === 'Meal Shop' && activeTab === 'meal-shop')
                    || (item.label === 'Booking History' && activeTab === 'laundry-bookings')
                    || (item.label === 'Complaints' && activeTab === 'complaints');

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        item.onClick();
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-2xl text-center transition-all ${
                        isActive
                          ? 'bg-white text-[#1f3f9a] shadow-md'
                          : 'text-blue-100 hover:bg-white/10'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-xl grid place-items-center ${
                        isActive ? 'bg-[#eef3ff]' : 'bg-white/15'
                      }`}>
                        <item.icon className={`h-4 w-4 ${isActive ? 'text-[#2458e6]' : 'text-white'}`} />
                      </div>
                      <div className={`font-semibold text-xs leading-4 ${isActive ? 'text-[#1f3f9a]' : 'text-white'}`}>
                        {item.label}
                      </div>
                    </button>
                  );
                })()
              ))}
            </nav>

          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto md:ml-44">
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

                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900">Laundry Services</h2>
                      <button
                        type="button"
                        className="text-sm font-medium text-blue-600 hover:underline"
                        onClick={() => setActiveTab('laundry')}
                      >
                        View all
                      </button>
                    </div>

                    {readyBookings.length > 0 && (
                      <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
                        <div className="text-sm font-semibold text-green-800">Your clothes are ready!</div>
                        <div className="mt-1 text-xs text-green-700">
                          {readyBookings.length} laundry booking{readyBookings.length > 1 ? 's are' : ' is'} marked ready for pickup.
                        </div>
                      </div>
                    )}

                    {laundryLoading ? (
                      <div className="text-sm text-gray-500">Loading laundry services...</div>
                    ) : laundryShops.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        No laundry shops are available right now.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {laundryShops.slice(0, 2).map((shop) => renderLaundryCard(shop, true))}
                      </div>
                    )}
                  </div>

                  {/* Recent Notifications */}
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
            {activeTab === 'laundry' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-50 rounded-lg">
                      <Shirt className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Laundry Services</h1>
                      <p className="text-sm text-gray-500">Find laundry providers and place your booking</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadLaundryShops}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>

                <div className="p-6">
                  {readyBookings.length > 0 && (
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
                      <div className="text-sm font-semibold text-green-800">Your clothes are ready!</div>
                      <div className="mt-1 text-xs text-green-700">
                        {readyBookings.length} laundry booking{readyBookings.length > 1 ? 's are' : ' is'} marked ready for pickup.
                      </div>
                    </div>
                  )}
                  {laundryError && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {laundryError}
                    </div>
                  )}
                  {laundryLoading ? (
                    <div className="text-sm text-gray-500">Loading laundry services...</div>
                  ) : laundryShops.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      No laundry shops are available right now.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {laundryShops.map((shop) => renderLaundryCard(shop))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'laundry-bookings' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laundry Bookings</h1>
                    <p className="text-sm text-gray-500">Track your laundry orders</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadMyLaundryBookings}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
                <div className="p-6">
                  {laundryBookingLoading ? (
                    <div className="text-sm text-gray-500">Loading bookings...</div>
                  ) : laundryBookings.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      No laundry bookings found yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {laundryBookings.map((booking) => (
                        <div key={booking._id} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-semibold text-gray-900">{booking.shop?.name || 'Laundry Shop'}</div>
                              <div className="text-xs text-gray-500">{new Date(booking.createdAt).toLocaleString()}</div>
                            </div>
                            <span className={`rounded-md px-2 py-1 text-xs font-medium ${booking.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'accepted'
                                ? 'bg-blue-100 text-blue-700'
                                : booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            Service: {booking.serviceType === 'dry-cleaning' ? 'Dry Cleaning' : booking.serviceType}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Contact: {booking.contactNumber || '-'}
                          </div>
                          {(booking.floor || booking.roomNumber) && (
                            <div className="text-sm text-gray-600 mt-1">
                              {booking.floor ? `Floor: ${booking.floor}` : ''}{booking.floor && booking.roomNumber ? ' | ' : ''}{booking.roomNumber ? `Room: ${booking.roomNumber}` : ''}
                            </div>
                          )}
                          {booking.notes ? <div className="text-sm text-gray-600 mt-1">Notes: {booking.notes}</div> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'meal-shop' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Store className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meal Shop</h1>
                    <p className="text-sm text-gray-500">Browse hostel meal shop services and updates</p>
                  </div>
                </div>
                <div className="p-6">
                  {!mealShopProfile ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      No meal shop details available yet.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Meal shop status</span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Open for orders
                        </span>
                      </div>

                      <div className="flex items-start gap-4">
                        {mealShopProfile.logoDataUrl ? (
                          <img
                            src={mealShopProfile.logoDataUrl}
                            alt={mealShopProfile.shopName || 'Meal shop logo'}
                            className="h-16 w-16 rounded-xl border border-amber-100 object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-amber-50 border border-amber-100 grid place-items-center">
                            <Store className="h-7 w-7 text-amber-600" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{mealShopProfile.shopName || 'Meal Shop'}</h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {mealShopProfile.serviceDetails || 'Service details not specified.'}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {(mealShopProfile.serviceDetails || '')
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean)
                              .slice(0, 4)
                              .map((service) => (
                                <span
                                  key={service}
                                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                                >
                                  {service}
                                </span>
                              ))}
                          </div>

                          <div className="mt-3 space-y-1.5 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {mealShopProfile.contactNumber || '-'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4" />
                              {formatTimeValue(mealShopProfile.openingTime)} - {formatTimeValue(mealShopProfile.closingTime)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Delivery: {mealShopProfile.deliveryAvailable === 'yes' ? 'Yes' : 'No'}
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Pre-Order: {mealShopProfile.preOrderAvailable === 'yes' ? 'Yes' : 'No'}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                            >
                              View Details
                            </button>
                            <a
                              href={`tel:${mealShopProfile.contactNumber || ''}`}
                              className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
                            >
                              Contact
                            </a>
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <div className="mb-2 text-sm font-semibold text-gray-900">Menu & Prices</div>
                            {mealMenuItems.length === 0 ? (
                              <div className="text-xs text-gray-500">
                                Menu items are not added yet by the Meal Shop admin.
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  {mealMenuItems.map((item) => (
                                    <label
                                      key={item.id}
                                      className="flex items-center justify-between gap-3 rounded-lg bg-white border border-gray-200 px-3 py-2 cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={selectedMealItems.includes(item.id)}
                                          onChange={() => toggleMealItem(item.id)}
                                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-800 truncate">{item.name}</span>
                                      </div>
                                      <span className="text-sm font-semibold text-blue-700">
                                        Rs. {item.price.toFixed(2)}
                                      </span>
                                    </label>
                                    
                                  ))}
                                </div>

                                <div className="mt-2 space-y-2">
                                  {selectedMealItems.map((itemId) => {
                                    const matched = mealMenuItems.find((it) => it.id === itemId);
                                    if (!matched) return null;
                                    const qty = Math.max(1, Number(mealItemQuantities[itemId] || 1));
                                    return (
                                      <div
                                        key={`qty-${itemId}`}
                                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                                      >
                                        <span className="text-xs font-medium text-gray-700">
                                          Qty - {matched.name}
                                        </span>
                                        <input
                                          type="number"
                                          min="1"
                                          value={qty}
                                          onChange={(e) => updateMealItemQty(itemId, e.target.value)}
                                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="mt-3 flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                                  <span className="text-sm font-semibold text-gray-800">Total Price</span>
                                  <span className="text-base font-bold text-blue-700">
                                    Rs. {selectedMealTotal.toFixed(2)}
                                  </span>
                                </div>

                                {mealOrderMessage && (
                                  <div className="mt-2 text-xs font-medium text-emerald-700">
                                    {mealOrderMessage}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={handleMealOrder}
                                  className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                  Order Now
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'complaints' && (
              <Complaints user={user} />
            )}

            {selectedShop && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-900">Book {selectedShop.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Submit your laundry booking details</p>

                  <form onSubmit={submitLaundryBooking} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                      <input
                        type="text"
                        value={bookingForm.studentName}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, studentName: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                      <input
                        type="tel"
                        value={bookingForm.contactNumber}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                        placeholder="07X XXX XXXX"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                        <input
                          type="text"
                          value={bookingForm.floor}
                          onChange={(e) => setBookingForm((prev) => ({ ...prev, floor: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2"
                          placeholder="1st Floor"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                        <input
                          type="text"
                          value={bookingForm.roomNumber}
                          onChange={(e) => setBookingForm((prev) => ({ ...prev, roomNumber: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2"
                          placeholder="A-101"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                      <select
                        value={bookingForm.serviceType}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, serviceType: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                      >
                        {(selectedShop.availableServices?.length ? selectedShop.availableServices : ['washing', 'dry-cleaning', 'ironing']).map((s) => (
                          <option key={s} value={s}>
                            {s === 'dry-cleaning' ? 'Dry Cleaning' : s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                      <textarea
                        value={bookingForm.notes}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedShop(null)}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bookingSubmitting}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {bookingSubmitting ? 'Booking...' : 'Confirm Booking'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {mealOrderModalOpen && (
              <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
                <div className="w-full max-w-2xl rounded-3xl bg-white p-7 shadow-xl">
                  <h3 className="text-xl font-semibold text-gray-900">Order Meal</h3>
                  <p className="text-sm text-gray-500 mt-1">Submit your meal order details</p>

                  <form onSubmit={submitMealOrder} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                      <input
                        type="text"
                        value={mealOrderForm.studentName}
                        onChange={(e) => setMealOrderForm((prev) => ({ ...prev, studentName: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5"
                        placeholder="Enter your name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                      <input
                        type="tel"
                        value={mealOrderForm.contactNumber}
                        onChange={(e) => setMealOrderForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5"
                        placeholder="07X XXX XXXX"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                        <input
                          type="text"
                          value={mealOrderForm.floor}
                          onChange={(e) => setMealOrderForm((prev) => ({ ...prev, floor: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5"
                          placeholder="1st Floor"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                        <input
                          type="text"
                          value={mealOrderForm.roomNumber}
                          onChange={(e) => setMealOrderForm((prev) => ({ ...prev, roomNumber: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5"
                          placeholder="A-101"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                      <textarea
                        value={mealOrderForm.notes}
                        onChange={(e) => setMealOrderForm((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 resize-none"
                      />
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Selected items:</span>{' '}
                        {mealMenuItems
                          .filter((item) => selectedMealItems.includes(item.id))
                          .map((item) => `${item.name} x ${Math.max(1, Number(mealItemQuantities[item.id] || 1))}`)
                          .join(', ') || '-'}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-blue-700">
                        Total: Rs. {selectedMealTotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setMealOrderModalOpen(false)}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={mealOrderSubmitting}
                        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {mealOrderSubmitting ? 'Ordering...' : 'Confirm Order'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
