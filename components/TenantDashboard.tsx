import React, { useState, useMemo, useEffect } from 'react';
import { Property, User, UserRole } from '../types';
import PropertyCard from './PropertyCard';
import { DetailsModal, VRModal, MapModal } from './Modals';
import { Search, SlidersHorizontal, User as UserIcon, LogOut, Heart, Sparkles, Home, Menu, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface TenantDashboardProps {
  user: User;
  onLogout: () => void;
}

enum TenantTab {
  FIND = 'FIND',
  AI_PICKS = 'AI_PICKS',
  FAVORITES = 'FAVORITES',
  ABOUT = 'ABOUT',
  PROFILE = 'PROFILE'
}

const TenantDashboard: React.FC<TenantDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TenantTab>(TenantTab.FIND);
  const [properties, setProperties] = useState<Property[]>([]);
  const [likedPropertyIds, setLikedPropertyIds] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVROpen, setIsVROpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    minRent: '',
    maxRent: '',
    city: '',
    furnishedType: 'Any',
    propertyType: 'Any',
    minRating: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchFavorites();

    // REALTIME: Listen for new properties added by owners
    const channel = supabase
      .channel('public:properties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, (payload) => {
        // Just refresh the whole list for simplicity
        fetchProperties();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (data) {
        // Map DB snake_case to CamelCase/Interfaces
        const mapped: Property[] = data.map(p => ({
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
        setProperties(mapped);
    }
  };

  const fetchFavorites = async () => {
    const { data } = await supabase.from('favorites').select('property_id').eq('user_id', user.id);
    if (data) {
        setLikedPropertyIds(data.map(d => d.property_id));
    }
  };

  const handleToggleLike = async (propertyId: string) => {
    const isLiked = likedPropertyIds.includes(propertyId);
    
    if (isLiked) {
        // Remove
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
        setLikedPropertyIds(prev => prev.filter(id => id !== propertyId));
    } else {
        // Add
        await supabase.from('favorites').insert([{ user_id: user.id, property_id: propertyId }]);
        setLikedPropertyIds(prev => [...prev, propertyId]);
        
        // Notification Logic could be here (Insert into notifications table) or handled via Database Trigger
        const prop = properties.find(p => p.id === propertyId);
        if (prop) {
            await supabase.from('notifications').insert([{
                owner_id: prop.owner_id,
                message: `Tenant ${user.email} liked your property "${prop.title}"`,
                is_read: false
            }]);
        }
    }
  };

  // AI Logic Helpers
  const likedProperties = useMemo(() => 
    properties.filter(p => likedPropertyIds.includes(p.id)), 
  [properties, likedPropertyIds]);

  const getRelevanceScore = (property: Property) => {
    let score = 0;
    score += property.rating * 2;
    if (likedProperties.length > 0) {
      const cityMatch = likedProperties.some(lp => lp.city === property.city);
      const typeMatch = likedProperties.some(lp => lp.property_type === property.property_type);
      if (cityMatch) score += 5;
      if (typeMatch) score += 3;
    }
    return score;
  };

  const filteredAIProperties = useMemo(() => {
    if (!isFiltered) return [];

    let filtered = properties.filter(p => {
      if (filters.minRent && p.rent < Number(filters.minRent)) return false;
      if (filters.maxRent && p.rent > Number(filters.maxRent)) return false;
      if (filters.city && !p.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.furnishedType !== 'Any' && p.furnished_type !== filters.furnishedType) return false;
      if (filters.propertyType !== 'Any' && p.property_type !== filters.propertyType) return false;
      if (filters.minRating && p.rating < Number(filters.minRating)) return false;
      return true;
    });

    return filtered.sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));
  }, [properties, filters, isFiltered, likedProperties]);


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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const renderTabButton = (tab: TenantTab, label: string, icon?: React.ReactNode) => (
    <button 
      onClick={() => { setActiveTab(tab); closeMobileMenu(); }}
      className={`${
        activeTab === tab 
          ? 'text-indigo-600 border-l-4 border-indigo-600 bg-indigo-50 md:bg-transparent md:border-l-0 md:border-b-2' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 md:hover:bg-transparent'
      } block w-full text-left md:inline-block md:w-auto px-4 py-3 md:px-1 md:py-1 text-base md:text-sm font-medium transition-colors`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
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
                <Home className="w-8 h-8" /> SmartHome
              </span>
            </div>
            
            <div className="hidden md:flex md:items-center md:space-x-8 h-full">
              {renderTabButton(TenantTab.FIND, 'Find Rentals')}
              {renderTabButton(TenantTab.AI_PICKS, 'AI Picks', <Sparkles size={16} />)}
              {renderTabButton(TenantTab.FAVORITES, 'Favorites')}
              {renderTabButton(TenantTab.ABOUT, 'About')}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-700 font-medium">Hi, {user.name}</span>
              <button onClick={() => setActiveTab(TenantTab.PROFILE)} className="p-2 rounded-full text-gray-400 hover:text-gray-500"><UserIcon size={20} /></button>
              <button onClick={onLogout} className="p-2 rounded-full text-red-400 hover:text-red-500"><LogOut size={20} /></button>
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
              {renderTabButton(TenantTab.FIND, 'Find Rentals')}
              {renderTabButton(TenantTab.AI_PICKS, 'AI Picks')}
              {renderTabButton(TenantTab.FAVORITES, 'Favorites')}
              {renderTabButton(TenantTab.ABOUT, 'About')}
              {renderTabButton(TenantTab.PROFILE, 'My Profile')}
            </div>
            <div className="pt-4 pb-4 border-t border-gray-200 px-4 flex justify-between items-center">
              <div>{user.email}</div>
              <button onClick={onLogout}><LogOut size={20} className="text-red-500" /></button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === TenantTab.FIND && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">All Rentals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(p => (
                <PropertyCard 
                  key={p.id}
                  property={p}
                  userRole={UserRole.TENANT}
                  isLiked={likedPropertyIds.includes(p.id)}
                  onToggleLike={handleToggleLike}
                  onViewDetails={handleOpenDetails}
                  onViewVR={handleOpenVR}
                  onViewMap={handleOpenMap}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === TenantTab.AI_PICKS && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
               <div className="flex items-center gap-2 mb-4">
                 <SlidersHorizontal className="text-indigo-600" />
                 <h2 className="text-xl font-bold text-gray-900">AI Smart Filters</h2>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <input type="number" placeholder="Min Rent" className="border rounded p-2 text-sm w-full" value={filters.minRent} onChange={e => setFilters({...filters, minRent: e.target.value})} />
                  <input type="number" placeholder="Max Rent" className="border rounded p-2 text-sm w-full" value={filters.maxRent} onChange={e => setFilters({...filters, maxRent: e.target.value})} />
                  <input type="text" placeholder="City" className="border rounded p-2 text-sm w-full" value={filters.city} onChange={e => setFilters({...filters, city: e.target.value})} />
                  <select className="border rounded p-2 text-sm w-full" value={filters.propertyType} onChange={e => setFilters({...filters, propertyType: e.target.value})}>
                    <option value="Any">Any Type</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                  </select>
                  <select className="border rounded p-2 text-sm w-full" value={filters.furnishedType} onChange={e => setFilters({...filters, furnishedType: e.target.value})}>
                    <option value="Any">Any Furnishing</option>
                    <option value="Fully Furnished">Fully</option>
                    <option value="Semi Furnished">Semi</option>
                  </select>
                  <input type="number" placeholder="Min Rating" className="border rounded p-2 text-sm w-full" value={filters.minRating} onChange={e => setFilters({...filters, minRating: e.target.value})} />
               </div>
               <button onClick={() => setIsFiltered(true)} className="w-full mt-4 bg-indigo-600 text-white py-2 rounded">Apply Filters</button>
            </div>

            {isFiltered && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredAIProperties.map(p => (
                      <PropertyCard key={p.id} property={p} userRole={UserRole.TENANT} isLiked={likedPropertyIds.includes(p.id)} onToggleLike={handleToggleLike} onViewDetails={handleOpenDetails} onViewVR={handleOpenVR} onViewMap={handleOpenMap} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === TenantTab.FAVORITES && (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-gray-900">Your Favorites</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {likedProperties.map(p => (
                 <PropertyCard key={p.id} property={p} userRole={UserRole.TENANT} isLiked={true} onToggleLike={handleToggleLike} onViewDetails={handleOpenDetails} onViewVR={handleOpenVR} onViewMap={handleOpenMap} />
               ))}
             </div>
          </div>
        )}

        {/* Profile & About Placeholder */}
        {activeTab === TenantTab.PROFILE && <div className="p-8 text-center">User: {user.email}</div>}
        {activeTab === TenantTab.ABOUT && (
  <div className="p-8 max-w-4xl mx-auto space-y-6 text-center">
    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
      About Smart Home Rental AI
    </h2>
    <p className="text-gray-600 text-base sm:text-lg">
      This platform helps owners list properties in minutes and uses AI to match
      them with the most suitable tenants, supported by immersive AR/VR
      visualizations for each home. [web:42][web:47]
    </p>

    <div className="grid gap-6 sm:grid-cols-3 text-left">
      <div className="bg-white/70 rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-1">For Owners</h3>
        <p className="text-sm text-gray-600">
          Add homes, manage listings, and see which properties get the most
          interest from tenants.
        </p>
      </div>
      <div className="bg-white/70 rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-1">For Tenants</h3>
        <p className="text-sm text-gray-600">
          Browse AI‑ranked rentals, explore 360° views, and save favorites in
          one place.
        </p>
      </div>
      <div className="bg-white/70 rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-900 mb-1">Powered by Supabase</h3>
        <p className="text-sm text-gray-600">
          All users, properties, and favorites are stored in a secure cloud
          database, so data is shared and persistent across devices. [web:12][web:15]
        </p>
      </div>
    </div>
  </div>
)}


      </main>

      {/* Modals */}
      {selectedProperty && (
        <>
          <DetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} property={selectedProperty} onVR={() => { setIsDetailsOpen(false); setIsVROpen(true); }} onMap={() => { setIsDetailsOpen(false); setIsMapOpen(true); }} onToggleLike={() => handleToggleLike(selectedProperty.id)} isLiked={likedPropertyIds.includes(selectedProperty.id)} role={UserRole.TENANT} />
          <VRModal isOpen={isVROpen} onClose={() => setIsVROpen(false)} videoUrl={selectedProperty.video_url} />
          <MapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} latitude={selectedProperty.latitude} longitude={selectedProperty.longitude} />
        </>
      )}
    </div>
  );
};

export default TenantDashboard;
