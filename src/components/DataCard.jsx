import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Upload, Edit3, Save, X, Plus, Trash2, MapPin } from 'lucide-react';

const DataCard = ({ intervention, onGeoJSONUpload, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    plantDate: intervention.plantDate,
    species: [...intervention.species]
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      plantDate: intervention.plantDate,
      species: [...intervention.species]
    });
  };

  const handleSave = () => {
    onUpdate(intervention.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      plantDate: intervention.plantDate,
      species: [...intervention.species]
    });
  };

  const handleSpeciesChange = (index, field, value) => {
    const newSpecies = [...editData.species];
    newSpecies[index] = { ...newSpecies[index], [field]: value };
    if (field === 'quantity') {
      newSpecies[index].quantity = parseInt(value) || 0;
    }
    newSpecies[index].valid = newSpecies[index].name.trim() !== '' && newSpecies[index].quantity > 0;
    setEditData({ ...editData, species: newSpecies });
  };

  const addSpecies = () => {
    if (editData.species.length < 6) {
      setEditData({
        ...editData,
        species: [...editData.species, { name: '', quantity: 0, valid: false }]
      });
    }
  };

  const removeSpecies = (index) => {
    const newSpecies = editData.species.filter((_, i) => i !== index);
    setEditData({ ...editData, species: newSpecies });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete intervention ${intervention.folioNo}?`)) {
      onDelete(intervention.id);
    }
  };

  const handleGeoJSONFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onGeoJSONUpload(intervention.id, file);
    }
  };

  const getValidationStatus = () => {
    const { validation } = intervention;
    if (validation.needsGeoJSON && validation.errors.length > 0) {
      return { color: 'border-red-300 bg-red-50', icon: XCircle, iconColor: 'text-red-500' };
    } else if (validation.needsGeoJSON) {
      return { color: 'border-yellow-300 bg-yellow-50', icon: AlertTriangle, iconColor: 'text-yellow-500' };
    } else if (!validation.isValid) {
      return { color: 'border-red-300 bg-red-50', icon: XCircle, iconColor: 'text-red-500' };
    } else {
      return { color: 'border-green-300 bg-green-50', icon: CheckCircle, iconColor: 'text-green-500' };
    }
  };

  const status = getValidationStatus();
  const StatusIcon = status.icon;

  return (
    <div className={`rounded-lg border-2 p-4 transition-all duration-200 ${status.color}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-5 h-5 ${status.iconColor}`} />
          <h3 className="font-medium text-gray-900">{intervention.folioNo}</h3>
          {intervention.edited && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              Edited
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {!isEditing ? (
            <>
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Edit intervention"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-red-400 hover:text-red-600 rounded"
                title="Delete intervention"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex space-x-1">
              <button
                onClick={handleSave}
                className="p-1 text-green-600 hover:text-green-700 rounded"
                title="Save changes"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Cancel editing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <span className="font-medium text-gray-700">Region:</span>
          <span className="text-gray-600 ml-1">{intervention.region}</span>
        </div>
        <div className="text-sm">
          <span className="font-medium text-gray-700">Beneficiary:</span>
          <span className="text-gray-600 ml-1">{intervention.beneficiario}</span>
        </div>
      </div>

      {/* Plant Date */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Plant Date
        </label>
        {isEditing ? (
          <input
            type="text"
            value={editData.plantDate}
            onChange={(e) => setEditData({ ...editData, plantDate: e.target.value })}
            placeholder="MM/DD/YYYY"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <div className="text-sm text-gray-600">{intervention.plantDate}</div>
        )}
      </div>

      {/* Species */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Species ({isEditing ? editData.species.length : intervention.species.length})
          </label>
          {isEditing && editData.species.length < 6 && (
            <button
              onClick={addSpecies}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          {(isEditing ? editData.species : intervention.species).map((species, index) => (
            <div key={index} className={`flex items-center space-x-2 p-2 rounded ${!species.valid && !isEditing ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={species.name}
                    onChange={(e) => handleSpeciesChange(index, 'name', e.target.value)}
                    placeholder="Species name"
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={species.quantity}
                    onChange={(e) => handleSpeciesChange(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                    min="0"
                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeSpecies(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 text-xs">
                    <span className="font-medium">{species.name}</span>
                  </div>
                  <div className="text-xs text-gray-600 font-mono">
                    {species.quantity.toLocaleString()}
                  </div>
                  {!species.valid && (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          Total: {(isEditing ? editData.species : intervention.species)
            .reduce((sum, s) => sum + s.quantity, 0).toLocaleString()} trees
        </div>
      </div>

      {/* GeoJSON Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            GeoJSON File
          </label>
          <MapPin className={`w-4 h-4 ${intervention.geojsonData ? 'text-green-500' : 'text-gray-400'}`} />
        </div>
        
        {intervention.geojsonData ? (
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">
              {intervention.geojsonFile?.name || `folio_${intervention.folioNo}.geojson`}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">
                Missing: folio_{intervention.folioNo}.geojson
              </span>
            </div>
            <label className="block">
              <input
                type="file"
                accept=".geojson,.json"
                onChange={handleGeoJSONFileUpload}
                className="hidden"
              />
              <div className="cursor-pointer flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50">
                <Upload className="w-4 h-4" />
                <span>Upload GeoJSON</span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {intervention.validation.errors.length > 0 && (
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs font-medium text-red-700 mb-1">Issues:</div>
          <ul className="text-xs text-red-600 space-y-1">
            {intervention.validation.errors.map((error, index) => (
              <li key={index} className="flex items-center space-x-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataCard;