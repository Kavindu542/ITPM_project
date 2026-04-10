import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../../services/authService';
import AdminLibraryShell, {
  AdminSidebarNavButton,
  AdminSidebarNavLinkItem,
} from '../../../../components/admin/AdminLibraryShell';
import { hostelService } from '../../../../services/hostelService';
import { confirmDialog } from '../../../../lib/dialog';
import { Shirt, Building2 } from 'lucide-react';

export default function HostelLaundryDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = React.useState('add-laundry');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [logoPreview, setLogoPreview] = React.useState('');
  const [bookingsLoading, setBookingsLoading] = React.useState(false);
  const [approvingBookingId, setApprovingBookingId] = React.useState('');
  const [deletingBookingId, setDeletingBookingId] = React.useState('');
  const [updatingReadyBookingId, setUpdatingReadyBookingId] = React.useState('');
  const [bookings, setBookings] = React.useState([]);
  const [readyStatusByBooking, setReadyStatusByBooking] = React.useState({});
  const [form, setForm] = React.useState({
    logoUrl: '',
    name: '',
    location: '',
    contactNumber: '',
    availableServices: [],
    priceInformation: '',
    openingHours: '',
    pickupDeliveryAvailable: false,
    shortDescription: '',
  });

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await hostelService.getLaundryShopProfile();
        if (!profile) return;
        setForm({
          logoUrl: profile.logoUrl || '',
          name: profile.name || '',
          location: profile.location || '',
          contactNumber: profile.contactNumber || '',
          availableServices: Array.isArray(profile.availableServices) ? profile.availableServices : [],
          priceInformation: profile.priceInformation || '',
          openingHours: profile.openingHours || '',
          pickupDeliveryAvailable: Boolean(profile.pickupDeliveryAvailable),
          shortDescription: profile.shortDescription || '',
        });
        setLogoPreview(profile.logoUrl || '');
      } catch (e) {
        setError(e?.message || 'Failed to load laundry details');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const loadLaundryBookings = async () => {
    try {
      setBookingsLoading(true);
      const data = await hostelService.getLaundryAdminBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load laundry bookings');
    } finally {
      setBookingsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!['view-laundry', 'send-info'].includes(activeSection)) return;
    loadLaundryBookings();
  }, [activeSection]);

  React.useEffect(() => {
    if (!Array.isArray(bookings) || bookings.length === 0) return;
    setReadyStatusByBooking((prev) => {
      const next = { ...prev };
      bookings.forEach((booking) => {
        next[booking._id] = booking.ready ? 'yes' : 'no';
      });
      return next;
    });
  }, [bookings]);

  const approvedBookings = React.useMemo(
    () => bookings.filter((booking) => ['accepted', 'completed'].includes(String(booking.status))),
    [bookings]
  );

  const handlePendingApproval = async (bookingId) => {
    try {
      setApprovingBookingId(bookingId);
      setError('');
      await hostelService.updateLaundryBookingStatus(bookingId, 'accepted');
      await loadLaundryBookings();
    } catch (e) {
      setError(e?.message || 'Failed to approve booking');
    } finally {
      setApprovingBookingId('');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    const ok = await confirmDialog({
      title: 'Delete booking',
      message: 'Delete this booking row?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      setDeletingBookingId(bookingId);
      setError('');
      await hostelService.deleteLaundryBooking(bookingId);
      await loadLaundryBookings();
    } catch (e) {
      setError(e?.message || 'Failed to delete booking');
    } finally {
      setDeletingBookingId('');
    }
  };

  const handleReadyChange = async (bookingId, value) => {
    const ready = value === 'yes';
    setReadyStatusByBooking((prev) => ({ ...prev, [bookingId]: value }));
    try {
      setUpdatingReadyBookingId(bookingId);
      setError('');
      await hostelService.updateLaundryBookingReady(bookingId, ready);
      await loadLaundryBookings();
    } catch (e) {
      setError(e?.message || 'Failed to update ready info');
    } finally {
      setUpdatingReadyBookingId('');
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleService = (service) => {
    setForm((prev) => {
      const hasService = prev.availableServices.includes(service);
      return {
        ...prev,
        availableServices: hasService
          ? prev.availableServices.filter((s) => s !== service)
          : [...prev.availableServices, service],
      };
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      setError('Only PNG, JPG, and GIF files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be 5MB or less.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '');
      setField('logoUrl', dataUrl);
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim() || !form.contactNumber.trim()) {
      setError('Laundry Shop Name and Contact Number are required.');
      return;
    }

    try {
      setSaving(true);
      await hostelService.saveLaundryShopProfile(form);
      setSuccess('Laundry shop details saved successfully.');
    } catch (e) {
      setError(e?.message || 'Failed to save laundry details');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/hostel', { replace: true });
  };

  return (
    <AdminLibraryShell
      user={user}
      productSubtitle="Laundry Admin"
      headerTitle="Hostel (Laundry)"
      headerSubtitle="Laundry dashboard"
      roleLabel="Laundry"
      onLogout={logout}
      onProfile={() => navigate('/profile')}
      sidebarNav={({ collapsed }) => (
        <>
          <div className="space-y-1">
            <AdminSidebarNavButton
              collapsed={collapsed}
              active={activeSection === 'add-laundry'}
              onClick={() => setActiveSection('add-laundry')}
              icon={Shirt}
              label="Add laundry"
              description="Shop profile & services"
            />
            <AdminSidebarNavButton
              collapsed={collapsed}
              active={activeSection === 'view-laundry'}
              onClick={() => setActiveSection('view-laundry')}
              icon={Shirt}
              label="View laundry"
              description="Student bookings"
            />
            <AdminSidebarNavButton
              collapsed={collapsed}
              active={activeSection === 'send-info'}
              onClick={() => setActiveSection('send-info')}
              icon={Shirt}
              label="Send info"
              description="Ready status"
            />
            <AdminSidebarNavLinkItem
              collapsed={collapsed}
              to="/admin/hostel"
              end
              icon={Building2}
              label="Hostel services"
              description="Back to hub"
            />
          </div>
        </>
      )}
    >
      <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {activeSection === 'view-laundry'
                  ? 'View Laundry Bookings'
                  : activeSection === 'send-info'
                    ? 'Send Info'
                    : 'Laundry Dashboard'}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Signed in as <span className="font-medium text-blue-600">{user?.email}</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              {activeSection === 'add-laundry' && (
                <>
                  <div className="mb-6 border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Laundry Shop Details</h3>
                    <p className="text-sm text-gray-500 mt-1">Create and manage your laundry service profile shown to students.</p>
                  </div>

                  {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      {success}
                    </div>
                  )}

                  {loading ? (
                    <div className="text-sm text-gray-600">Loading shop details...</div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Laundry Shop Logo / Image</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      onChange={handleLogoChange}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-gray-500">Upload PNG, JPG, GIF up to 5MB</p>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Laundry logo" className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Laundry Shop Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2"
                        placeholder="Quick Wash"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input
                        type="tel"
                        value={form.contactNumber}
                        onChange={(e) => setField('contactNumber', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2"
                        placeholder="077 123 4567"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setField('location', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2"
                      placeholder="Hostel block A, ground floor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Services</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={form.availableServices.includes('washing')}
                          onChange={() => toggleService('washing')}
                        />
                        <span className="text-sm text-gray-700">Washing</span>
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={form.availableServices.includes('dry-cleaning')}
                          onChange={() => toggleService('dry-cleaning')}
                        />
                        <span className="text-sm text-gray-700">Dry Cleaning</span>
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={form.availableServices.includes('ironing')}
                          onChange={() => toggleService('ironing')}
                        />
                        <span className="text-sm text-gray-700">Ironing</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Information (optional)</label>
                      <input
                        type="text"
                        value={form.priceInformation}
                        onChange={(e) => setField('priceInformation', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2"
                        placeholder="Starting from Rs. 120 per item"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
                      <input
                        type="text"
                        value={form.openingHours}
                        onChange={(e) => setField('openingHours', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2"
                        placeholder="Mon-Sat 8:00 AM - 6:00 PM"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup & Delivery Available</label>
                    <select
                      value={form.pickupDeliveryAvailable ? 'yes' : 'no'}
                      onChange={(e) => setField('pickupDeliveryAvailable', e.target.value === 'yes')}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description of the Service</label>
                    <textarea
                      value={form.shortDescription}
                      onChange={(e) => setField('shortDescription', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 resize-none"
                      placeholder="Fast and affordable laundry with same-day pickup."
                    />
                  </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        <Shirt className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Laundry Shop Details'}
                      </button>
                    </form>
                  )}
                </>
              )}

              {activeSection === 'view-laundry' && (
                <>
                  <div className="mb-6 border-b border-gray-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Student Laundry Bookings</h3>
                      <p className="text-sm text-gray-500 mt-1">View bookings submitted by hostel students.</p>
                    </div>
                    <button
                      type="button"
                      onClick={loadLaundryBookings}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Refresh
                    </button>
                  </div>

                  {bookingsLoading ? (
                    <div className="text-sm text-gray-600">Loading bookings...</div>
                  ) : bookings.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      No student laundry bookings yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b border-gray-200">
                            <th className="px-3 py-3 font-semibold">Student Name</th>
                            <th className="px-3 py-3 font-semibold">Contact Number</th>
                            <th className="px-3 py-3 font-semibold">Floor</th>
                            <th className="px-3 py-3 font-semibold">Room Number</th>
                            <th className="px-3 py-3 font-semibold">Service</th>
                            <th className="px-3 py-3 font-semibold">Status</th>
                            <th className="px-3 py-3 font-semibold">Requested At</th>
                            <th className="px-3 py-3 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {bookings.map((booking) => (
                            <tr key={booking._id} className="text-gray-800 hover:bg-gray-50">
                              <td className="px-3 py-3">{booking.studentName || '-'}</td>
                              <td className="px-3 py-3">{booking.contactNumber || '-'}</td>
                              <td className="px-3 py-3">{booking.floor || '-'}</td>
                              <td className="px-3 py-3">{booking.roomNumber || '-'}</td>
                              <td className="px-3 py-3 capitalize">{booking.serviceType === 'dry-cleaning' ? 'Dry Cleaning' : booking.serviceType}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium capitalize border ${
                                  booking.status === 'accepted'
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : booking.status === 'completed'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : booking.status === 'cancelled'
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                  }`}>
                                  {booking.status === 'accepted' ? 'approved' : booking.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-gray-600">{new Date(booking.createdAt).toLocaleString()}</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  {booking.status === 'pending' ? (
                                    <button
                                      type="button"
                                      onClick={() => handlePendingApproval(booking._id)}
                                      disabled={approvingBookingId === booking._id}
                                      className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:bg-gray-400"
                                    >
                                      {approvingBookingId === booking._id ? 'Approving...' : 'Pending Approval'}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBooking(booking._id)}
                                    disabled={deletingBookingId === booking._id}
                                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
                                  >
                                    {deletingBookingId === booking._id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeSection === 'send-info' && (
                <>
                  <div className="mb-6 border-b border-gray-100 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Approved Laundry Bookings</h3>
                      <p className="text-sm text-gray-500 mt-1">Send readiness info for approved student bookings.</p>
                    </div>
                    <button
                      type="button"
                      onClick={loadLaundryBookings}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Refresh
                    </button>
                  </div>

                  {bookingsLoading ? (
                    <div className="text-sm text-gray-600">Loading bookings...</div>
                  ) : approvedBookings.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      No approved laundry bookings yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b border-gray-200">
                            <th className="px-3 py-3 font-semibold">Student Name</th>
                            <th className="px-3 py-3 font-semibold">Contact Number</th>
                            <th className="px-3 py-3 font-semibold">Floor</th>
                            <th className="px-3 py-3 font-semibold">Room Number</th>
                            <th className="px-3 py-3 font-semibold">Service</th>
                            <th className="px-3 py-3 font-semibold">Approval Status</th>
                            <th className="px-3 py-3 font-semibold">Ready</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {approvedBookings.map((booking) => (
                            <tr key={booking._id} className="text-gray-800 hover:bg-gray-50">
                              <td className="px-3 py-3">{booking.studentName || '-'}</td>
                              <td className="px-3 py-3">{booking.contactNumber || '-'}</td>
                              <td className="px-3 py-3">{booking.floor || '-'}</td>
                              <td className="px-3 py-3">{booking.roomNumber || '-'}</td>
                              <td className="px-3 py-3 capitalize">{booking.serviceType === 'dry-cleaning' ? 'Dry Cleaning' : booking.serviceType}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium border ${
                                  booking.status === 'completed'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-green-50 border-green-200 text-green-700'
                                }`}>
                                  {booking.status === 'completed' ? 'Completed' : 'Approved'}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <select
                                  value={readyStatusByBooking[booking._id] || 'no'}
                                  onChange={(e) => handleReadyChange(booking._id, e.target.value)}
                                  disabled={updatingReadyBookingId === booking._id}
                                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-700"
                                >
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
    </AdminLibraryShell>
  );
}
