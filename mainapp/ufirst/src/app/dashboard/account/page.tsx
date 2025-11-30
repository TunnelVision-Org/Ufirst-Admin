'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { ArrowLeft, Star, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isCurrentUserAdmin } from '@/lib/auth';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'trainer' | 'client';
  clients?: Array<{
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
}

// Hardcoded permissions
const ADMIN_PERMISSIONS = ['User Management', 'Trainer Management', 'Client Management', 'Reports & Analytics', 'System Settings'];
const TRAINER_PERMISSIONS = ['View Clients', 'Manage Workouts', 'Manage Meal Plans', 'View Reports'];

export default function AccountPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // User profile state - initialize from localStorage immediately to prevent flicker
  const [name, setName] = useState(() => {
    if (typeof window !== 'undefined') {
      const localUser = getCurrentUser();
      if (localUser) {
        return `${localUser.firstName} ${localUser.lastName}`.trim() || 'User';
      }
    }
    return 'User';
  });
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      const localUser = getCurrentUser();
      return localUser?.email || '';
    }
    return '';
  });
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  // Fetch fresh user data from Gadget on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const localUser = getCurrentUser();
      if (!localUser) {
        router.push('/login');
        return;
      }

      try {
        // Fetch fresh data from Gadget using existing API
        const response = await fetch(`/api/trainers/getByEmail?email=${encodeURIComponent(localUser.email)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data: UserData = await response.json();
        console.log('[Account] Fetched user data:', data);
        
        setUserData(data);
        
        // Set user info from fetched data
        const fullName = `${data.firstName} ${data.lastName}`.trim();
        setName(fullName || 'User');
        setEmail(data.email);

        setLoading(false);
      } catch (err) {
        console.error('[Account] Error fetching user data:', err);
        setError('Failed to load account data');
        
        // Fallback to localStorage data
        const fullName = `${localUser.firstName} ${localUser.lastName}`.trim();
        setName(fullName || 'User');
        setEmail(localUser.email);
        setUserData({
          id: localUser.id,
          email: localUser.email,
          firstName: localUser.firstName,
          lastName: localUser.lastName,
          role: isCurrentUserAdmin() ? 'admin' : 'trainer'
        });
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleEdit = () => {
    setEditForm({ name, email });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!userData) return;

    setName(editForm.name);
    setEmail(editForm.email);
    setIsEditing(false);

    // Update the main user data in localStorage
    const localUser = getCurrentUser();
    if (localUser) {
      localStorage.setItem('user', JSON.stringify({
        ...localUser,
        firstName: editForm.name.split(' ')[0] || localUser.firstName,
        lastName: editForm.name.split(' ').slice(1).join(' ') || localUser.lastName,
        email: editForm.email
      }));
    }
  };

  const handleCancel = () => {
    setEditForm({ name: '', email: '' });
    setIsEditing(false);
  };

  const getRole = () => {
    if (!userData) return 'Trainer';
    switch (userData.role) {
      case 'admin':
        return 'Administrator';
      default:
        return 'Trainer';
    }
  };

  const getPermissions = () => {
    if (!userData) return [];
    if (userData.role === 'admin') {
      return ADMIN_PERMISSIONS;
    }
    return TRAINER_PERMISSIONS;
  };

  const getClientCount = () => {
    if (userData?.role === 'trainer' && userData.clients) {
      return userData.clients.length;
    }
    return 0;
  };

  if (loading) {
    return (
      <DashboardLayout userName="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C4526]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={name.split(' ')[0]}>
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            {error} - Showing cached data
          </div>
        )}

        <Card className="overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* Left Sidebar */}
              <div className="bg-[#F7F5ED] p-8 space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarFallback className="bg-[#3C4526] text-white text-3xl font-bold">
                      {name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full text-center text-xl font-bold text-gray-900 mb-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                      placeholder="Your Name"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{name}</h2>
                  )}
                  
                  <p className="text-sm text-black mb-3">{getRole()}</p>
                  
                  {userData?.role === 'trainer' && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-semibold text-gray-900">5.0</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
                        className="w-full bg-[#3C4526] hover:bg-[#2d331c] text-white"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      className="w-full border-[#3C4526] bg-[#3C4526] text-white hover:bg-[#2d331c] hover:text-white"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Role Section */}
                <div>
                  <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-3">
                    ROLE
                  </h3>
                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 bg-[#3C4526] text-white rounded-full text-xs font-medium">
                      {getRole()}
                    </span>
                  </div>
                </div>

                {/* Permissions Section */}
                <div>
                  <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-3">
                    PERMISSIONS
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    {getPermissions().map((permission, index) => (
                      <div key={index}>{permission}</div>
                    ))}
                  </div>
                </div>

                {/* Stats for Trainers */}
                {userData?.role === 'trainer' && (
                  <div>
                    <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-3">
                      STATISTICS
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Clients:</span>
                        <span className="font-semibold text-gray-900">{getClientCount()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Content Area */}
              <div className="md:col-span-2 p-8">
                {/* Contact Information */}
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-4">
                    CONTACT INFORMATION
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="text-sm text-black mb-1 block">Email:</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                          placeholder="Email address"
                        />
                      ) : (
                        <a href={`mailto:${email}`} className="text-[#3C4526] hover:underline text-sm">
                          {email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div>
                  <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-4">
                    BASIC INFORMATION
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-black">User ID:</span>
                      <span className="text-gray-900 font-medium">{userData?.id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-black">Role:</span>
                      <span className="text-gray-900 font-medium">{getRole()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-black">Last Login:</span>
                      <span className="text-gray-900 font-medium">Today, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-black">Status:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
