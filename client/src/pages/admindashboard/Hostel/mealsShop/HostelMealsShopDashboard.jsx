import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../../services/authService';
import AdminLibraryShell, {
  AdminSidebarNavButton,
  AdminSidebarNavLinkItem,
} from '../../../../components/admin/AdminLibraryShell';
import { Store, Building2, ClipboardList } from 'lucide-react';

export default function HostelMealsShopDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = React.useState('meal-shop');
  const [shopForm, setShopForm] = React.useState({
    shopName: '',
    contactNumber: '',
    serviceDetails: '',
    openingTime: '',
    closingTime: '',
    deliveryAvailable: 'yes',
    preOrderAvailable: 'yes',
    logoDataUrl: '',
    menuItems: [],
  });
  const [menuDraft, setMenuDraft] = React.useState({ name: '', price: '' });
  const [formMessage, setFormMessage] = React.useState('');
  const [orders, setOrders] = React.useState([]);

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/hostel', { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShopForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setFormMessage('Please upload PNG, JPG, or GIF logo file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormMessage('Logo file size must be 5MB or less.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setShopForm((prev) => ({ ...prev, logoDataUrl: String(reader.result || '') }));
      setFormMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shopForm.menuItems.length) {
      setFormMessage('Please add at least one menu item with a price.');
      return;
    }
    const mealShopData = {
      ...shopForm,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('hostelMealShopProfile', JSON.stringify(mealShopData));
    setFormMessage('Meal shop details saved successfully and visible to students.');
  };

  const addMenuItem = () => {
    const itemName = menuDraft.name.trim();
    const itemPrice = Number(menuDraft.price);
    if (!itemName || Number.isNaN(itemPrice) || itemPrice <= 0) {
      setFormMessage('Enter a valid menu item name and price.');
      return;
    }

    const newItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: itemName,
      price: itemPrice,
    };
    setShopForm((prev) => ({ ...prev, menuItems: [...prev.menuItems, newItem] }));
    setMenuDraft({ name: '', price: '' });
    setFormMessage('');
  };

  const removeMenuItem = (id) => {
    setShopForm((prev) => ({
      ...prev,
      menuItems: prev.menuItems.filter((item) => item.id !== id),
    }));
  };

  const loadMealOrders = () => {
    try {
      const raw = localStorage.getItem('hostelMealShopOrders');
      const parsed = raw ? JSON.parse(raw) : [];
      setOrders(Array.isArray(parsed) ? parsed : []);
    } catch (err) {
      console.error('Failed to load meal orders', err);
      setOrders([]);
    }
  };

  React.useEffect(() => {
    if (activeSection === 'orders') {
      loadMealOrders();
    }
  }, [activeSection]);

  return (
    <AdminLibraryShell
      user={user}
      productSubtitle="Meals Shop Admin"
      headerTitle="Hostel (Meals Shop)"
      headerSubtitle="Meals shop dashboard"
      roleLabel="Meals shop"
      onLogout={logout}
      onProfile={() => navigate('/profile')}
      sidebarNav={({ collapsed }) => (
        <div className="space-y-1">
          <AdminSidebarNavButton
            collapsed={collapsed}
            active={activeSection === 'meal-shop'}
            onClick={() => setActiveSection('meal-shop')}
            icon={Store}
            label="Meal shop"
            description="Profile & menu"
          />
          <AdminSidebarNavButton
            collapsed={collapsed}
            active={activeSection === 'orders'}
            onClick={() => setActiveSection('orders')}
            icon={ClipboardList}
            label="Orders"
            description="Student orders"
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
      )}
    >
      <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Meals Shop Dashboard</h2>
              <p className="mt-2 text-sm text-gray-500">
                Signed in as <span className="font-medium text-blue-600">{user?.email}</span>
              </p>
            </div>

            {activeSection === 'meal-shop' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 text-gray-700 mb-6">
                <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
                  <Store className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Meal Shop Profile Form</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Create and manage your meal shop details.</p>
                </div>
              </div>

              {formMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {formMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                  <input
                    type="text"
                    name="shopName"
                    value={shopForm.shopName}
                    onChange={handleChange}
                    placeholder="Enter shop name"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop Logo</label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif"
                    onChange={handleLogoChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Upload PNG, JPG, or GIF (max 5MB).</p>
                  {shopForm.logoDataUrl && (
                    <img
                      src={shopForm.logoDataUrl}
                      alt="Meal shop logo preview"
                      className="mt-3 h-16 w-16 rounded-lg border border-gray-200 object-cover"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="text"
                      name="contactNumber"
                      value={shopForm.contactNumber}
                      onChange={handleChange}
                      placeholder="07X XXX XXXX"
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Details</label>
                    <input
                      type="text"
                      name="serviceDetails"
                      value={shopForm.serviceDetails}
                      onChange={handleChange}
                      placeholder="Rice & curry, kottu, snacks..."
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opening Time</label>
                    <input
                      type="time"
                      name="openingTime"
                      value={shopForm.openingTime}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closing Time</label>
                    <input
                      type="time"
                      name="closingTime"
                      value={shopForm.closingTime}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Available</label>
                    <select
                      name="deliveryAvailable"
                      value={shopForm.deliveryAvailable}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pre-Order Available</label>
                    <select
                      name="preOrderAvailable"
                      value={shopForm.preOrderAvailable}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/70">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">Menu Items & Prices</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={menuDraft.name}
                      onChange={(e) => setMenuDraft((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Item name (e.g. Chicken Rice)"
                      className="md:col-span-2 rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={menuDraft.price}
                      onChange={(e) => setMenuDraft((prev) => ({ ...prev, price: e.target.value }))}
                      placeholder="Price"
                      className="rounded-lg border border-gray-200 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addMenuItem}
                    className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                  >
                    Add Menu Item
                  </button>

                  <div className="mt-3 space-y-2">
                    {shopForm.menuItems.length === 0 ? (
                      <p className="text-sm text-gray-500">No menu items added yet.</p>
                    ) : (
                      shopForm.menuItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-2">
                          <div className="text-sm text-gray-800">
                            <span className="font-medium">{item.name}</span>
                            <span className="ml-2 text-blue-700 font-semibold">Rs. {Number(item.price).toFixed(2)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMenuItem(item.id)}
                            className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    Save Meal Shop Details
                  </button>
                </div>
              </form>
            </div>
            )}

            {activeSection === 'orders' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Meal Orders</h3>
                    <p className="text-sm text-gray-500">View student orders placed from the hostel dashboard.</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadMealOrders}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    No meal orders yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Student</th>
                          <th className="px-4 py-3 font-semibold">Student ID</th>
                          <th className="px-4 py-3 font-semibold">Contact</th>
                          <th className="px-4 py-3 font-semibold">Floor</th>
                          <th className="px-4 py-3 font-semibold">Room</th>
                          <th className="px-4 py-3 font-semibold">Email</th>
                          <th className="px-4 py-3 font-semibold">Items</th>
                          <th className="px-4 py-3 font-semibold">Qty</th>
                          <th className="px-4 py-3 font-semibold">Total</th>
                          <th className="px-4 py-3 font-semibold">Ordered At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3 text-gray-800">{order.studentName || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{order.studentId || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{order.contactNumber || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{order.floor || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{order.roomNumber || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{order.studentEmail || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {Array.isArray(order.items) && order.items.length > 0
                                ? order.items.map((item) => item?.name).filter(Boolean).join(', ')
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {Array.isArray(order.items) && order.items.length > 0
                                ? order.items
                                  .map((item) => {
                                    const itemName = String(item?.name || '').trim();
                                    const qty = Math.max(1, Number(item?.quantity || 1));
                                    return itemName ? `${itemName} x ${qty}` : null;
                                  })
                                  .filter(Boolean)
                                  .join(', ')
                                : '-'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-blue-700">
                              Rs. {Number(order.totalPrice || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
    </AdminLibraryShell>
  );
}
