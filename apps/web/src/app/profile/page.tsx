'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Plus,
  Trash2,
  CheckCircle,
  Building,
  Home,
  Tag,
  Phone,
  Mail,
  Shield,
  Clock,
  Edit2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Address {
  id: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
  tag: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phone: '',
    street: '',
    city: 'Islamabad',
    province: 'Federal Capital',
    postalCode: '',
    isDefault: false,
    tag: 'HOME',
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setAddressLoading(true);
      const res = await apiFetch<{ success: boolean; data: Address[] }>('/users/me/addresses');
      if (res?.data) {
        setAddresses(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load addresses:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileName.trim(),
          phone: profilePhone.trim() || null,
        }),
      });
      await refreshUser();
      setIsEditingProfile(false);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSubmitting(true);
    setAddressError(null);
    try {
      await apiFetch('/users/me/addresses', {
        method: 'POST',
        body: JSON.stringify({
          recipientName: addressForm.recipientName.trim(),
          phone: addressForm.phone.trim(),
          street: addressForm.street.trim(),
          city: addressForm.city.trim(),
          province: addressForm.province?.trim() || null,
          postalCode: addressForm.postalCode?.trim() || null,
          isDefault: addressForm.isDefault,
          tag: addressForm.tag,
        }),
      });
      setIsAddingAddress(false);
      setAddressForm({
        recipientName: '',
        phone: '',
        street: '',
        city: 'Islamabad',
        province: 'Federal Capital',
        postalCode: '',
        isDefault: false,
        tag: 'HOME',
      });
      await fetchAddresses();
    } catch (err: any) {
      setAddressError(err.message || 'Failed to create address');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await apiFetch(`/users/me/addresses/${addressId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isDefault: true }),
      });
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to set default address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      await apiFetch(`/users/me/addresses/${addressId}`, {
        method: 'DELETE',
      });
      setAddresses(prev => prev.filter(a => a.id !== addressId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-sm">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-ink">Sign in required</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            Please log in to manage your customer profile and delivery addresses.
          </p>
          <Button variant="primary" size="md" onClick={() => router.push('/login')} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Title */}
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Account & Addresses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal contact info, security credentials, and verified delivery locations.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-600/30 border border-teal-400/40 text-teal-200 flex items-center justify-center font-black text-2xl shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold">{user.name}</h2>
                <p className="text-xs text-teal-200/80 mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                {user.role}
              </span>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {profileMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Shield className="w-3.5 h-3.5 text-teal-700" />
                    Mass-Assignment Protection
                  </div>
                  <p>Account Email and Role ({user.role}) are security-anchored and cannot be altered via self-service profile edits.</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button variant="primary" size="sm" type="submit" isLoading={profileLoading}>
                    Save Changes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileName(user.name || '');
                      setProfilePhone(user.phone || '');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Email Address</span>
                  <span className="text-slate-800 font-bold mt-1 block">{user.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Contact Phone</span>
                  <span className="text-slate-800 font-bold mt-1 block">{user.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Account Role</span>
                  <span className="text-slate-800 font-bold mt-1 block">{user.role}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Saved Addresses Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">Saved Shipping Addresses</h2>
              <p className="text-xs text-slate-500">
                Addresses used to auto-populate express checkout and courier delivery.
              </p>
            </div>
            {!isAddingAddress && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddingAddress(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add New Address
              </Button>
            )}
          </div>

          {/* Add Address Form Modal / Box */}
          {isAddingAddress && (
            <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  Add New Delivery Address
                </h3>
                <button
                  onClick={() => setIsAddingAddress(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {addressError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addressError}</span>
                </div>
              )}

              <form onSubmit={handleCreateAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={addressForm.recipientName}
                      onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                      placeholder="e.g. Muhammad Saad Raza"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Street Address / House / Plaza</label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="e.g. House 42, Street 7, Sector F-8/2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <select
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      required
                    >
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Peshawar">Peshawar</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Multan">Multan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Province / Region</label>
                    <input
                      type="text"
                      value={addressForm.province}
                      onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                      placeholder="Federal Capital / Punjab"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      placeholder="e.g. 44000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="tag"
                        checked={addressForm.tag === 'HOME'}
                        onChange={() => setAddressForm({ ...addressForm, tag: 'HOME' })}
                      />
                      Home
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="tag"
                        checked={addressForm.tag === 'WORK'}
                        onChange={() => setAddressForm({ ...addressForm, tag: 'WORK' })}
                      />
                      Work / Office
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="tag"
                        checked={addressForm.tag === 'OTHER'}
                        onChange={() => setAddressForm({ ...addressForm, tag: 'OTHER' })}
                      />
                      Other
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-teal-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded text-teal-700 focus:ring-teal-600"
                    />
                    Set as Default Shipping Address
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button variant="primary" size="sm" type="submit" isLoading={addressSubmitting}>
                    Save Address
                  </Button>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddingAddress(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Addresses Grid */}
          {addressLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading saved addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-ink">No saved shipping addresses</p>
              <p className="text-[11px] text-slate-500">
                Add your home or office address to enable quick 1-click checkout.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs relative transition-all ${
                    addr.isDefault
                      ? 'border-teal-500 bg-teal-50/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {addr.tag}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="font-bold text-xs text-ink">{addr.recipientName}</p>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400 inline" />
                    {addr.phone}
                  </p>

                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                    {addr.street}, {addr.city}
                    {addr.province ? `, ${addr.province}` : ''}
                    {addr.postalCode ? ` - ${addr.postalCode}` : ''}
                  </p>

                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="mt-4 text-[11px] font-bold text-teal-700 hover:text-teal-900 transition-colors"
                    >
                      Set as Default Shipping Address →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
