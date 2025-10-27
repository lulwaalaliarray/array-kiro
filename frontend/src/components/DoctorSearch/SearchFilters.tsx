import React, { useState } from 'react';

interface SearchCriteria {
  name?: string;
  specialization?: string;
  location?: string;
  minRating?: number;
  maxConsultationFee?: number;
  isAcceptingPatients?: boolean;
  radius?: number;
}

interface SearchFiltersType {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'rating' | 'experience' | 'fee';
  sortOrder?: 'asc' | 'desc';
}

interface SearchFiltersProps {
  onSearch: (criteria: SearchCriteria) => void;
  onFilterChange: (filters: SearchFiltersType) => void;
  loading?: boolean;
}

const specializations = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology'
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onSearch,
  onFilterChange,
  loading = false
}) => {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    isAcceptingPatients: true,
    radius: 25
  });
  const [filters, setFilters] = useState<SearchFiltersType>({
    sortBy: 'rating',
    sortOrder: 'desc',
    limit: 10
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCriteriaChange = (field: keyof SearchCriteria, value: any) => {
    setCriteria(prev => ({ ...prev, [field]: value }));
  };

  const handleFilterChange = (field: keyof SearchFiltersType, value: any) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(criteria);
  };

  const handleReset = () => {
    const resetCriteria = {
      isAcceptingPatients: true,
      radius: 25
    };
    setCriteria(resetCriteria);
    onSearch(resetCriteria);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Doctor Name
            </label>
            <input
              type="text"
              value={criteria.name || ''}
              onChange={(e) => handleCriteriaChange('name', e.target.value)}
              placeholder="Search by doctor name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <select
              value={criteria.specialization || ''}
              onChange={(e) => handleCriteriaChange('specialization', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Radius
            </label>
            <select
              value={criteria.radius || 25}
              onChange={(e) => handleCriteriaChange('radius', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
          </button>

          <div className="flex items-center gap-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={criteria.isAcceptingPatients || false}
                onChange={(e) => handleCriteriaChange('isAcceptingPatients', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Only accepting patients</span>
            </label>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Rating
                </label>
                <select
                  value={criteria.minRating || ''}
                  onChange={(e) => handleCriteriaChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any Rating</option>
                  <option value={4.5}>4.5+ Stars</option>
                  <option value={4.0}>4.0+ Stars</option>
                  <option value={3.5}>3.5+ Stars</option>
                  <option value={3.0}>3.0+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Consultation Fee ($)
                </label>
                <input
                  type="number"
                  value={criteria.maxConsultationFee || ''}
                  onChange={(e) => handleCriteriaChange('maxConsultationFee', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Enter maximum fee..."
                  min="0"
                  step="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy || 'rating'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="rating">Rating</option>
                  <option value="name">Name</option>
                  <option value="experience">Experience</option>
                  <option value="fee">Consultation Fee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </div>
            ) : (
              'Search Doctors'
            )}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};