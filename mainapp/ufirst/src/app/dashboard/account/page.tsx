'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { MapPin, ArrowLeft, Star, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@ufirst.com');
  const [location, setLocation] = useState('New York, NY');
  const [editForm, setEditForm] = useState({ name: '', email: '', location: '' });

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('adminProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setName(profile.name || 'Admin User');
      setEmail(profile.email || 'admin@ufirst.com');
      setLocation(profile.location || 'New York, NY');
    }
  }, []);

  const handleEdit = () => {
    setEditForm({ name, email, location });
    setIsEditing(true);
  };

  const handleSave = () => {
    setName(editForm.name);
    setEmail(editForm.email);
    setLocation(editForm.location);
    setIsEditing(false);
    
    // Save to localStorage
    localStorage.setItem('adminProfile', JSON.stringify({
      name: editForm.name,
      email: editForm.email,
      location: editForm.location
    }));
  };

  const handleCancel = () => {
    setEditForm({ name: '', email: '', location: '' });
    setIsEditing(false);
  };

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
                  
                  <p className="text-sm text-black mb-3">Administrator</p>
                  
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-semibold text-gray-900">5.0</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
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
                      className="w-full border-[#3C4526]  bg-[#3C4526] text-[#FFFFF] hover:bg-[#3C4526] hover:text-white"
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
                      Administrator
                    </span>
                  </div>
                </div>

                {/* Skills Section */}
                <div>
                  <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-3">
                    PERMISSIONS
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div>User Management</div>
                    <div>Trainer Management</div>
                    <div>Client Management</div>
                    <div>Reports & Analytics</div>
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="md:col-span-2 p-8">
                {/* Header with Location */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3C4526]"
                          placeholder="Location"
                        />
                      ) : (
                        <span className="text-sm">{location}</span>
                      )}
                    </div>
                  </div>
                </div>

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

                    {/* Site */}
                    <div>
                      <label className="text-sm text-black mb-1 block">Site:</label>
                      <a href="https://ufirst.com" target="_blank" rel="noopener noreferrer" className="text-[#3C4526] hover:underline text-sm">
                        www.ufirst.com
                      </a>
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
                      <span className="text-black">Account Created:</span>
                      <span className="text-gray-900 font-medium">January 15, 2024</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-black">Role:</span>
                      <span className="text-gray-900 font-medium">Administrator</span>
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
