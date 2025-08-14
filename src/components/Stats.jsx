import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, MapPin, TreePine, Edit3 } from 'lucide-react';

const StatsPanel = ({ stats }) => {
  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center">
        <Icon className={`w-5 h-5 ${color} mr-3`} />
        <div>
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Data Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={CheckCircle}
          label="Total Records"
          value={stats.total}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        
        <StatCard
          icon={CheckCircle}
          label="Valid & Ready"
          value={stats.valid}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        
        <StatCard
          icon={XCircle}
          label="Invalid"
          value={stats.invalid}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        
        <StatCard
          icon={MapPin}
          label="Missing GeoJSON"
          value={stats.missingGeoJSON}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        
        <StatCard
          icon={TreePine}
          label="Total Trees"
          value={stats.totalTrees.toLocaleString()}
          color="text-green-700"
          bgColor="bg-green-50"
        />
        
        <StatCard
          icon={Edit3}
          label="Edited Records"
          value={stats.edited}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Upload Readiness</span>
          <span>{stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.total > 0 ? (stats.valid / stats.total) * 100 : 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;