import React, { useState, useEffect } from 'react';
import { Property, User, Notification, UserRole, PropertyType, FurnishedType } from '../types';
import PropertyCard from './PropertyCard';
import { DetailsModal, VRModal, MapModal } from './Modals';
import { PlusCircle, List, Bell, User as UserIcon, LogOut, Home, Info, Upload, Link as LinkIcon, Edit2, MapPin, Menu, X, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface OwnerDashboardProps {
  user: User;
  onLogout: () => void;
}

enum OwnerTab {
  MY_PROPERTIES = 'MY_PROPERTIES',
  ADD_PROPERTY = 'ADD_PROPERTY',
  NOTIFICATIONS = 'NOTIFICATIONS',
  ABOUT = 'ABOUT',
  PROFILE = 'PROFILE'
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<OwnerTab>(OwnerTab.MY_PROPERTIES);
  const [properties, setProperties] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modal States
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVROpen, setIsVROpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Video/Image Upload State
  const [videoInputType, setVideoInputType] = useState<'URL' | 'UPLOAD'>('URL');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    rating: '4.0',
    furnishedType: FurnishedType.FULLY,
    propertyType: PropertyType.BHK2,
    imageUrl: 'https://picsum.photos/800/600',
    rent: '',
    videoUrl: '',
    latitude: '',
    longitude: ''
  });

  // --- Fetch Data ---
  useEffect(() => {
    fetchMyProperties();
    fetchNotifications();
  }, [user.id]);

  const fetchMyProperties = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching properties:', error);
    } else {
      // Map Snake Case from DB to Camel Case for Frontend if needed, 
      // or ensure types match. Our types.ts now uses snake_case keys for some fields.
      // We need to cast or map carefully.
      const mappedProperties: Property[] = (data || []).map(p => ({
        id: p.id,
        owner_id: p.owner_id,
        owner_email: p.owner_email,
        title: p.title,
        description: p.description,
        city: p.city,
        property_type: p.property_type,
        furnished_type: p.furnished_type,
        rating: p.rating,
        rent: p.rent,
        image_url: p.image_url,
        video_url: p.video_url,
        latitude: p.latitude,
        longitude: p.longitude,
        created_at: p.created_at
      }));
      setProperties(mappedProperties);
    }
    setIsLoading(false);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setNotifications(data);
  };

  // --- Actions ---

  const handleOpenDetails = (p: Property) => {
    setSelectedProperty(p);
    setIsDetailsOpen(true);
  };

  const handleOpenVR = (p: Property) => {
    setSelectedProperty(p);
    setIsVROpen(true);
  };

  const handleOpenMap = (p: Property) => {
    setSelectedProperty(p);
    setIsMapOpen(true);
  };

  const handleEditClick = (p: Property) => {
    setEditingId(p.id);
    setFormData({
      title: p.title,
      description: p.description,
      city: p.city,
      rating: p.rating.toString(),
      furnishedType: p.furnished_type as FurnishedType,
      propertyType: p.property_type as PropertyType,
      imageUrl: p.image_url,
      rent: p.rent.toString(),
      videoUrl: p.video_url || '',
      latitude: p.latitude.toString(),
      longitude: p.longitude.toString()
    });
    
    // Check if video is from supabase storage
    if (p.video_url && p.video_url.includes('supabase.co')) {
      setVideoInputType('UPLOAD');
    } else {
      setVideoInputType('URL');
    }
    
    setActiveTab(OwnerTab.ADD_PROPERTY);
    closeMobileMenu();
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this property?")) {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) {
        alert("Error deleting property");
      } else {
        fetchMyProperties();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const uploadVideo = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('property-media').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video');
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.rent) {
      alert("Please fill in required fields.");
      return;
    }

    let finalVideoUrl = formData.videoUrl;

    if (videoInputType === 'UPLOAD' && videoFile) {
      const uploadedUrl = await uploadVideo(videoFile);
      if (uploadedUrl) finalVideoUrl = uploadedUrl;
    }

    const payload = {
      owner_id: user.id,
      owner_email: user.email,
      title: formData.title,
      description: formData.description,
      city: formData.city,
      rating: Number(formData.rating),
      furnished_type: formData.furnishedType,
      property_type: formData.propertyType,
      image_url: formData.imageUrl,
      rent: Number(formData.rent),
      video_url: finalVideoUrl,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
    };

    if (editingId) {
      const { error } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', editingId);
      
      if (error) alert("Update failed: " + error.message);
      else alert("Property updated successfully!");
    } else {
      const { error } = await supabase
        .from('properties')
        .insert([payload]);

      if (error) alert("Insert failed: " + error.message);
      else alert("Property added successfully!");
    }

    resetForm();
    fetchMyProperties();
    setActiveTab(OwnerTab.MY_PROPERTIES);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '', description: '', city: '', rating: '4.0', furnishedType: FurnishedType.FULLY,
      propertyType: PropertyType.BHK2, imageUrl: 'https://picsum.photos/800/600',
      rent: '', videoUrl: '', latitude: '', longitude: ''
    });
    setVideoInputType('URL');
    setVideoFile(null);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const renderTabButton = (tab: OwnerTab, label: string, icon?: React.ReactNode, extra?: React.ReactNode) => (
    <button 
      onClick={() => { setActiveTab(tab); resetForm(); closeMobileMenu(); }}
      className={`${
        activeTab === tab 
          ? 'text-indigo-600 border-l-4 border-indigo-600 bg-indigo-50 md:bg-transparent md:border-l-0 md:border-b-2' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 md:hover:bg-transparent'
      } block w-full text-left md:inline-block md:w-auto px-4 py-3 md:px-1 md:py-1 text-base md:text-sm font-medium transition-colors`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
        {extra}
      </span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
                <Home className="w-8 h-8" /> SmartHome <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded ml-2 hidden sm:inline-block">Owner</span>
              </span>
            </div>
            
            <div className="hidden md:flex md:items-center md:space-x-8 h-full">
              {renderTabButton(OwnerTab.MY_PROPERTIES, 'My Properties')}
              {renderTabButton(
                OwnerTab.ADD_PROPERTY, 
                editingId ? 'Edit Property' : 'Add Property', 
                editingId ? <Edit2 size={16} /> : <PlusCircle size={16} />
              )}
              {renderTabButton(
                OwnerTab.NOTIFICATIONS, 
                'Notifications', 
                <Bell size={16} />,
                notifications.filter(n => !n.is_read).length > 0 && <span className="ml-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              {renderTabButton(OwnerTab.ABOUT, 'About')}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-700 font-medium">{user.name}</span>
              <button onClick={() => setActiveTab(OwnerTab.PROFILE)} className="p-2 rounded-full text-gray-400 hover:text-gray-500">
                <UserIcon size={20} />
              </button>
              <button onClick={onLogout} className="p-2 rounded-full text-red-400 hover:text-red-500">
                <LogOut size={20} />
              </button>
            </div>

            <div className="flex items-center md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-400">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 shadow-lg animate-fadeIn">
            <div className="pt-2 pb-3 space-y-1">
              {renderTabButton(OwnerTab.MY_PROPERTIES, 'My Properties')}
              {renderTabButton(OwnerTab.ADD_PROPERTY, editingId ? 'Edit Property' : 'Add Property')}
              {renderTabButton(OwnerTab.NOTIFICATIONS, 'Notifications')}
              {renderTabButton(OwnerTab.ABOUT, 'About')}
              {renderTabButton(OwnerTab.PROFILE, 'My Profile')}
            </div>
            <div className="pt-4 pb-4 border-t border-gray-200 px-4 flex justify-between items-center">
              <div>{user.email}</div>
              <button onClick={onLogout}><LogOut size={20} className="text-red-500" /></button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === OwnerTab.MY_PROPERTIES && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><List /> My Properties</h2>
            {isLoading ? <p>Loading properties...</p> : (
              properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map(p => (
                    <PropertyCard 
                      key={p.id}
                      property={p}
                      userRole={UserRole.OWNER}
                      onViewDetails={handleOpenDetails}
                      onViewVR={handleOpenVR}
                      onViewMap={handleOpenMap}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">You haven't listed any properties yet.</p>
                  <button onClick={() => { setActiveTab(OwnerTab.ADD_PROPERTY); resetForm(); }} className="mt-4 text-indigo-600 font-medium hover:underline">Add your first property</button>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === OwnerTab.ADD_PROPERTY && (
           <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{editingId ? 'Edit Property' : 'List a New Property'}</h2>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-4">
               <div><label className="block text-sm font-medium text-gray-700">Title</label><input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
               <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required /></div>
               <div><label className="block text-sm font-medium text-gray-700">City / Place</label><input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required /></div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium text-gray-700">Rent (₹/mo)</label><input type="number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.rent} onChange={e => setFormData({...formData, rent: e.target.value})} required /></div>
                 <div><label className="block text-sm font-medium text-gray-700">Rating</label><input type="number" step="0.1" max="5" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})} /></div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Type</label>
                   <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value as any})}>
                     {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Furnishing</label>
                   <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.furnishedType} onChange={e => setFormData({...formData, furnishedType: e.target.value as any})}>
                     {Object.values(FurnishedType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>
               </div>
               
               <div><label className="block text-sm font-medium text-gray-700">Image URL</label><input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} required /></div>
               
               {/* VR/Video Section */}
               <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">VR View / Video Walkthrough</label>
                  <div className="flex flex-col sm:flex-row gap-4 mb-3">
                    <button type="button" onClick={() => setVideoInputType('URL')} className={`flex-1 py-1 px-3 rounded text-sm border ${videoInputType === 'URL' ? 'bg-white border-indigo-500 text-indigo-600' : 'bg-transparent'}`}>Link (YouTube)</button>
                    <button type="button" onClick={() => setVideoInputType('UPLOAD')} className={`flex-1 py-1 px-3 rounded text-sm border ${videoInputType === 'UPLOAD' ? 'bg-white border-indigo-500 text-indigo-600' : 'bg-transparent'}`}>Upload Video</button>
                  </div>
                  
                  {videoInputType === 'URL' ? (
                     <input type="text" className="block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="YouTube Link" />
                  ) : (
                    <div>
                      <input type="file" accept="video/*" className="block w-full text-sm text-gray-500" onChange={handleFileChange} />
                      {uploadingFile && <span className="text-xs text-indigo-600">Uploading...</span>}
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium text-gray-700">Latitude</label><input type="number" step="any" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} required /></div>
                 <div><label className="block text-sm font-medium text-gray-700">Longitude</label><input type="number" step="any" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} required /></div>
               </div>

               <div className="pt-4 flex flex-col sm:flex-row gap-4">
                 <button disabled={uploadingFile} type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                   {editingId ? 'Update Property' : 'Add Property'}
                 </button>
                 {editingId && (
                   <button type="button" onClick={resetForm} className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                 )}
               </div>
             </form>
           </div>
        )}

        {activeTab === OwnerTab.NOTIFICATIONS && (
          <div className="max-w-3xl mx-auto space-y-4">
             <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>
             {notifications.length > 0 ? (
                notifications.map(n => (
                  <div key={n.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500 flex items-start">
                    <Info className="text-indigo-500 mt-1 mr-3 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-gray-800">{n.message}</p>
                      <span className="text-xs text-gray-500 block mt-1">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
             ) : (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-md">No notifications yet.</div>
             )}
          </div>
        )}

        {/* About & Profile tabs (Simpler static content) */}
        {activeTab === OwnerTab.ABOUT && <div className="text-center p-8">About Content</div>}
        {activeTab === OwnerTab.PROFILE && <div className="text-center p-8">Profile: {user.email}</div>}

      </main>

       {/* Modals */}
       {selectedProperty && (
        <>
          <DetailsModal 
            isOpen={isDetailsOpen} 
            onClose={() => setIsDetailsOpen(false)} 
            property={selectedProperty}
            onVR={() => { setIsDetailsOpen(false); setIsVROpen(true); }}
            onMap={() => { setIsDetailsOpen(false); setIsMapOpen(true); }}
            role={UserRole.OWNER}
          />
          <VRModal 
            isOpen={isVROpen} 
            onClose={() => setIsVROpen(false)} 
            videoUrl={selectedProperty.video_url} 
          />
          <MapModal 
            isOpen={isMapOpen} 
            onClose={() => setIsMapOpen(false)} 
            latitude={selectedProperty.latitude} 
            longitude={selectedProperty.longitude} 
          />
        </>
      )}
    </div>
  );
};

export default OwnerDashboard;
