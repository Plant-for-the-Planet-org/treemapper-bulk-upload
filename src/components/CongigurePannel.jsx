import React from 'react';
import { Upload, Settings, FileText, FolderOpen, CheckCircle } from 'lucide-react';

const ConfigurationPanel = ({ 
  config, 
  setConfig, 
  csvFile, 
  setCsvFile, 
  locationFolder, 
  geojsonFiles, 
  onLocationFolderSelect, 
  onLoadData 
}) => {
  const handleConfigChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const isConfigValid = () => {
    return config.bearerToken.trim() !== '' && 
           config.apiUrl.trim() !== '' && 
           config.tenantKey.trim() !== '' && 
           config.plantProject.trim() !== '' &&
           csvFile;
  };

  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">API Configuration</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bearer Token *
            </label>
            <input
              type="password"
              value={config.bearerToken}
              onChange={(e) => handleConfigChange('bearerToken', e.target.value)}
              placeholder="Enter your JWT bearer token"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from your Plant for the Planet API access
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API URL
            </label>
            <input
              type="url"
              value={config.apiUrl}
              onChange={(e) => handleConfigChange('apiUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant Key
            </label>
            <input
              type="text"
              value={config.tenantKey}
              onChange={(e) => handleConfigChange('tenantKey', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plant Project ID
            </label>
            <input
              type="text"
              value={config.plantProject}
              onChange={(e) => handleConfigChange('plantProject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <FileText className="w-5 h-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Data Files</h2>
        </div>
        
        <div className="space-y-4">
          {/* CSV Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File *
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex-1 flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    {csvFile ? (
                      <span className="text-sm text-gray-900 font-medium">
                        {csvFile.name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Click to select CSV file
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Select your intervention data CSV file
                  </div>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
              {csvFile && (
                <div className="flex-shrink-0">
                  <div className="text-xs text-gray-500">
                    Size: {(csvFile.size / 1024).toFixed(1)} KB
                  </div>
                  <div className="text-xs text-gray-500">
                    Modified: {new Date(csvFile.lastModified).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GeoJSON Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Folder (Optional)
            </label>
            <div className="space-y-3">
              <label className="flex-1 flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <FolderOpen className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    {locationFolder ? (
                      <div>
                        <span className="text-sm text-gray-900 font-medium">
                          {locationFolder}
                        </span>
                        <div className="text-xs text-green-600 mt-1">
                          {geojsonFiles.size} GeoJSON files found
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Click to select location folder
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Select the folder containing your GeoJSON files
                  </div>
                </div>
                <input
                  type="file"
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={onLocationFolderSelect}
                  className="hidden"
                />
              </label>

              {geojsonFiles.size > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <div className="text-sm text-green-800">
                      <div className="font-medium">
                        Found {geojsonFiles.size} GeoJSON files
                      </div>
                      <div className="text-xs text-green-700 mt-1">
                        Files will be automatically matched with interventions when you load CSV data
                      </div>
                    </div>
                  </div>
                  
                  {/* Show sample of found files */}
                  <div className="mt-2 text-xs text-green-700">
                    <div className="font-medium mb-1">Sample files:</div>
                    <div className="space-y-0.5">
                      {Array.from(geojsonFiles.entries()).slice(0, 3).map(([folioNo, fileInfo]) => (
                        <div key={folioNo} className="flex items-center space-x-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span>{fileInfo.file.name}</span>
                        </div>
                      ))}
                      {geojsonFiles.size > 3 && (
                        <div className="text-green-600">
                          ... and {geojsonFiles.size - 3} more files
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start">
                <FolderOpen className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="text-blue-800 font-medium mb-2">
                    GeoJSON File Options:
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-blue-100 p-2 rounded">
                      <div className="font-medium text-blue-900 text-xs">Option 1: Select Location Folder</div>
                      <div className="text-blue-700 text-xs">
                        Choose the folder containing your GeoJSON files above
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 p-2 rounded">
                      <div className="font-medium text-blue-900 text-xs">Option 2: Manual Upload Later</div>
                      <div className="text-blue-700 text-xs">
                        Upload individual files using the cards after loading CSV
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-white border border-blue-200 rounded">
                    <div className="text-blue-700 text-xs font-medium mb-1">Required Naming:</div>
                    <code className="text-xs text-blue-800">folio_[FOLIO_NUMBER].geojson</code>
                    <div className="text-blue-600 text-xs mt-1">
                      Example: folio_PB2401001.geojson
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Load Data Button */}
      <div className="flex justify-end">
        <button
          onClick={onLoadData}
          disabled={!isConfigValid()}
          className={`px-6 py-3 text-sm font-medium rounded-md flex items-center ${
            isConfigValid()
              ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Load Data
        </button>
      </div>

      {/* Configuration Summary */}
      {isConfigValid() && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-sm text-green-800">
            <div className="font-medium mb-2">Configuration Ready!</div>
            <div className="space-y-1 text-xs">
              <div>• Bearer Token: ••••••••••••••••</div>
              <div>• API URL: {config.apiUrl}</div>
              <div>• CSV File: {csvFile?.name}</div>
              <div>• GeoJSON Files: {geojsonFiles.size > 0 ? `${geojsonFiles.size} files from ${locationFolder}` : 'Will upload manually'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationPanel;