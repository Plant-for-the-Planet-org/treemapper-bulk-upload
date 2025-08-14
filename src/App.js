import React, { useState, useCallback } from 'react';
import { Upload, Settings, CheckCircle, XCircle, AlertTriangle, Download, Play, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import ConfigurationPanel from './components/CongigurePannel';
import StatsPanel from './components/Stats';
import DataCard from './components/DataCard';
import UploadProgress from './components/UploadProgress';
import InterventionUploader from './components/InterventionUploader';
import './App.css';


function App() {
  // Configuration State
  const [config, setConfig] = useState({
    bearerToken: '',
    apiUrl: 'https://app-staging.plant-for-the-planet.org/treemapper/interventions',
    tenantKey: 'ten_NxJq55pm',
    plantProject: 'proj_eKBbIt7Bzavu9o7xzCAqjS2t'
  });

  // File State
  const [csvFile, setCsvFile] = useState(null);
  const [locationFolder, setLocationFolder] = useState(null);
  const [geojsonFiles, setGeojsonFiles] = useState(new Map());
  const [interventions, setInterventions] = useState([]);
  
  // UI State
  const [currentStep, setCurrentStep] = useState('config'); // config, data, upload, results
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadResults, setUploadResults] = useState(null);

  // Handle location folder selection
  const handleLocationFolderSelect = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    const geojsonFileMap = new Map();
    
    // Process all selected files
    for (const file of files) {
      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        // Extract folio number from filename (e.g., folio_PB2401001.geojson -> PB2401001)
        const match = file.name.match(/folio_([^.]+)\.(geojson|json)$/i);
        if (match) {
          const folioNo = match[1];
          try {
            const text = await file.text();
            const geojsonData = JSON.parse(text);
            geojsonFileMap.set(folioNo, {
              file: file,
              data: geojsonData
            });
          } catch (error) {
            console.warn(`Failed to parse ${file.name}:`, error);
          }
        }
      }
    }
    
    setGeojsonFiles(geojsonFileMap);
    setLocationFolder(files.length > 0 ? files[0].webkitRelativePath.split('/')[0] : null);
    
    // Update interventions if they're already loaded
    if (interventions.length > 0) {
      setInterventions(prev => prev.map(intervention => {
        const geojsonMatch = geojsonFileMap.get(intervention.folioNo);
        if (geojsonMatch) {
          return {
            ...intervention,
            geojsonFile: geojsonMatch.file,
            geojsonData: geojsonMatch.data,
            validation: {
              ...intervention.validation,
              needsGeoJSON: false,
              isValid: intervention.validation.errors.length === 0
            }
          };
        }
        return intervention;
      }));
    }
  }, [interventions]);
  const handleLoadData = useCallback(async () => {
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    try {
      const csvText = await csvFile.text();
      const lines = csvText.split('\n');
      const csvWithoutFirstLine = lines.slice(1).join('\n');

      const parsedData = Papa.parse(csvWithoutFirstLine, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        delimiter: ','
      });

      const processedInterventions = await Promise.all(
        parsedData.data
          .filter(row => row['FOLIO No'] && row['FOLIO No'].trim() !== '')
          .map(async (row, index) => {
            const intervention = {
              id: index,
              originalRow: row,
              folioNo: row['FOLIO No'],
              region: row['NOMBRE DE LA REGION'],
              municipio: row['MUNICIPIO PREDIO'],
              predio: row['NOMBRE DEL PREDIO'],
              beneficiario: row['BENEFICIARIO'],
              plantDate: row['FEHA DE ENTREGA'],
              superficie: row['SUPERFICIE FINAL'],
              plantaEntregada: row[' PLANTA ENTREGADA '],
              species: extractSpeciesFromRow(row),
              geojsonFile: null,
              geojsonData: null,
              validation: validateIntervention(row),
              edited: false
            };

            // Try to auto-load GeoJSON file from public folder
            try {
              const geojsonResponse = await fetch(`/location/folio_${row['FOLIO No']}.geojson`);
              if (geojsonResponse.ok) {
                const geojsonText = await geojsonResponse.text();
                const geojsonData = JSON.parse(geojsonText);
                intervention.geojsonData = geojsonData;
                intervention.validation = {
                  ...intervention.validation,
                  needsGeoJSON: false,
                  isValid: intervention.validation.errors.length === 0
                };
              }
            } catch (error) {
              // GeoJSON file not found or invalid, will need manual upload
              console.log(`GeoJSON not found for ${row['FOLIO No']}: ${error.message}`);
            }

            return intervention;
          })
      );

      setInterventions(processedInterventions);
      setCurrentStep('data');
    } catch (error) {
      alert('Error parsing CSV: ' + error.message);
    }
  }, [csvFile]);

  // Extract species data from CSV row
  const extractSpeciesFromRow = (row) => {
    const species = [];
    for (let i = 1; i <= 6; i++) {
      const speciesColumn = i === 1 ? "ESPECIE 1" : `ESPECIE ${i}`;
      const quantityColumn = i === 1 ? "CANTIDAD" : `CANTIDAD_${i-1}`;
      
      const speciesName = row[speciesColumn];
      const quantity = row[quantityColumn];
      
      if (speciesName && speciesName.trim() !== '') {
        const cleanQuantity = quantity ? parseInt(quantity.toString().replace(/,/g, '').trim(), 10) : 0;
        species.push({
          name: speciesName.trim(),
          quantity: cleanQuantity,
          valid: speciesName.trim() !== '' && cleanQuantity > 0
        });
      }
    }
    return species;
  };

  // Validate intervention data
  const validateIntervention = (row) => {
    const errors = [];
    
    // Check plant date
    const plantDate = row['FEHA DE ENTREGA'];
    if (!plantDate || !isValidDate(plantDate)) {
      errors.push('Invalid or missing plant date');
    }
    
    // Check species
    const species = extractSpeciesFromRow(row);
    if (species.length === 0) {
      errors.push('No species data found');
    } else {
      const invalidSpecies = species.filter(s => !s.valid);
      if (invalidSpecies.length > 0) {
        errors.push(`${invalidSpecies.length} invalid species entries`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      needsGeoJSON: true // Will be updated when GeoJSON is loaded
    };
  };

  // Validate date format
  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!dateRegex.test(dateString.trim())) return false;
    
    const [month, day, year] = dateString.trim().split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  };

  // Handle GeoJSON file upload for specific intervention
  const handleGeoJSONUpload = useCallback((interventionId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geojsonData = JSON.parse(e.target.result);
        setInterventions(prev => prev.map(intervention => 
          intervention.id === interventionId 
            ? { 
                ...intervention, 
                geojsonFile: file,
                geojsonData: geojsonData,
                validation: { 
                  ...intervention.validation, 
                  needsGeoJSON: false,
                  isValid: intervention.validation.errors.length === 0
                }
              }
            : intervention
        ));
      } catch (error) {
        alert('Invalid GeoJSON file: ' + error.message);
      }
    };
    reader.readAsText(file);
  }, []);

  // Update intervention data
  const updateIntervention = useCallback((interventionId, updates) => {
    setInterventions(prev => prev.map(intervention => 
      intervention.id === interventionId 
        ? { 
            ...intervention, 
            ...updates,
            edited: true,
            validation: validateIntervention({
              ...intervention.originalRow,
              'FEHA DE ENTREGA': updates.plantDate || intervention.plantDate,
              // Update species in original row format for validation
              ...(updates.species ? createRowFromSpecies(updates.species) : {})
            })
          }
        : intervention
    ));
  }, []);

  // Delete intervention
  const deleteIntervention = useCallback((interventionId) => {
    setInterventions(prev => prev.filter(intervention => intervention.id !== interventionId));
  }, []);

  // Bulk delete invalid interventions
  const deleteAllInvalid = useCallback(() => {
    const invalidCount = interventions.filter(i => !i.validation.isValid || i.validation.needsGeoJSON).length;
    if (invalidCount === 0) {
      alert('No invalid interventions to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete all ${invalidCount} invalid interventions? This cannot be undone.`)) {
      setInterventions(prev => prev.filter(i => i.validation.isValid && !i.validation.needsGeoJSON));
    }
  }, [interventions]);

  // Delete interventions missing GeoJSON only
  const deleteMissingGeoJSON = useCallback(() => {
    const missingCount = interventions.filter(i => i.validation.needsGeoJSON).length;
    if (missingCount === 0) {
      alert('No interventions missing GeoJSON to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete all ${missingCount} interventions missing GeoJSON files? This cannot be undone.`)) {
      setInterventions(prev => prev.filter(i => !i.validation.needsGeoJSON));
    }
  }, [interventions]);

  // Create row format from species array for validation
  const createRowFromSpecies = (species) => {
    const row = {};
    species.forEach((spec, index) => {
      if (index < 6) {
        const speciesColumn = index === 0 ? "ESPECIE 1" : `ESPECIE ${index + 1}`;
        const quantityColumn = index === 0 ? "CANTIDAD" : `CANTIDAD_${index}`;
        row[speciesColumn] = spec.name;
        row[quantityColumn] = spec.quantity.toString();
      }
    });
    return row;
  };

  // Calculate stats
  const stats = {
    total: interventions.length,
    valid: interventions.filter(i => i.validation.isValid && !i.validation.needsGeoJSON).length,
    invalid: interventions.filter(i => !i.validation.isValid || i.validation.needsGeoJSON).length,
    missingGeoJSON: interventions.filter(i => i.validation.needsGeoJSON).length,
    totalTrees: interventions.reduce((sum, i) => sum + i.species.reduce((s, sp) => s + sp.quantity, 0), 0),
    edited: interventions.filter(i => i.edited).length,
    deleted: 0 // This will be calculated if we track deleted items separately
  };

  // Check if ready to upload
  const isReadyToUpload = () => {
    return stats.invalid === 0 && config.bearerToken.trim() !== '';
  };

  // Handle upload process
  const handleStartUpload = async () => {
    if (!isReadyToUpload()) {
      alert('Please fix all validation errors and ensure Bearer token is provided');
      return;
    }

    setIsUploading(true);
    setCurrentStep('upload');
    setUploadProgress({ current: 0, total: interventions.length });

    const uploader = new InterventionUploader(config);
    const results = await uploader.uploadInterventions(
      interventions,
      (progress) => setUploadProgress(progress)
    );

    setUploadResults(results);
    setIsUploading(false);
    setCurrentStep('results');
  };

  // Download results as ZIP
  const downloadResults = async () => {
    if (!uploadResults) return;

    const zip = new JSZip();
    
    // Add success log
    if (uploadResults.successLog.records.length > 0) {
      zip.file('success_log.json', JSON.stringify(uploadResults.successLog, null, 2));
    }
    
    // Add error log
    if (uploadResults.errorLog.records.length > 0) {
      zip.file('error_log.json', JSON.stringify(uploadResults.errorLog, null, 2));
    }
    
    // Add failed records CSV
    if (uploadResults.failedRecords.length > 0) {
      const csvContent = Papa.unparse(uploadResults.failedRecords.map(r => r.originalRow));
      zip.file('failed_records.csv', csvContent);
    }
    
    // Add summary report
    const summary = {
      uploadDate: new Date().toISOString(),
      totalProcessed: uploadResults.totalProcessed,
      successful: uploadResults.successCount,
      failed: uploadResults.errorCount,
      successRate: `${((uploadResults.successCount / uploadResults.totalProcessed) * 100).toFixed(1)}%`,
      configuration: config
    };
    zip.file('upload_summary.json', JSON.stringify(summary, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intervention_upload_results_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Plant for the Planet - Bulk Intervention Uploader
            </h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${currentStep === 'config' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${currentStep === 'data' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${currentStep === 'upload' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${currentStep === 'results' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Configuration Step */}
        {currentStep === 'config' && (
          <div className="space-y-6">
            <ConfigurationPanel
              config={config}
              setConfig={setConfig}
              csvFile={csvFile}
              setCsvFile={setCsvFile}
              locationFolder={locationFolder}
              geojsonFiles={geojsonFiles}
              onLocationFolderSelect={handleLocationFolderSelect}
              onLoadData={handleLoadData}
            />
          </div>
        )}

        {/* Data Review Step */}
        {currentStep === 'data' && (
          <div className="space-y-6">
            <StatsPanel stats={stats} />
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
                <h2 className="text-lg font-medium text-gray-900">
                  Review and Edit Intervention Data
                </h2>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  {/* Bulk Actions */}
                  {stats.invalid > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={deleteMissingGeoJSON}
                        disabled={stats.missingGeoJSON === 0}
                        className={`px-3 py-2 text-xs font-medium rounded-md ${
                          stats.missingGeoJSON > 0
                            ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300'
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        }`}
                        title="Delete all interventions missing GeoJSON files"
                      >
                        <Trash2 className="w-3 h-3 mr-1 inline" />
                        Delete Missing GeoJSON ({stats.missingGeoJSON})
                      </button>
                      <button
                        onClick={deleteAllInvalid}
                        className="px-3 py-2 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 rounded-md"
                        title="Delete all invalid interventions"
                      >
                        <Trash2 className="w-3 h-3 mr-1 inline" />
                        Delete All Invalid ({stats.invalid})
                      </button>
                    </div>
                  )}
                  
                  {/* Navigation */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentStep('config')}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Back to Config
                    </button>
                    <button
                      onClick={handleStartUpload}
                      disabled={!isReadyToUpload()}
                      className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                        isReadyToUpload()
                          ? 'text-white bg-green-600 hover:bg-green-700'
                          : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Upload ({stats.valid} ready)
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {interventions.map((intervention) => (
                  <DataCard
                    key={intervention.id}
                    intervention={intervention}
                    onGeoJSONUpload={handleGeoJSONUpload}
                    onUpdate={updateIntervention}
                    onDelete={deleteIntervention}
                  />
                ))}
                
                {interventions.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">No interventions loaded</div>
                    <div className="text-gray-500 text-sm">Load your CSV file to see intervention data here</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress Step */}
        {currentStep === 'upload' && (
          <UploadProgress 
            progress={uploadProgress}
            isUploading={isUploading}
          />
        )}

        {/* Results Step */}
        {currentStep === 'results' && uploadResults && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Complete!</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResults.successCount}
                  </div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {uploadResults.errorCount}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {((uploadResults.successCount / uploadResults.totalProcessed) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-700">Success Rate</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={downloadResults}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Results (ZIP)
                </button>
                <button
                  onClick={() => {
                    setCurrentStep('config');
                    setInterventions([]);
                    setUploadResults(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Start New Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;