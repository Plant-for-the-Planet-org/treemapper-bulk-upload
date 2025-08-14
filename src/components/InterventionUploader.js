import axios from 'axios';

class InterventionUploader {
  constructor(config) {
    this.config = config;
    this.successLog = {
      startTime: new Date().toISOString(),
      totalSuccessful: 0,
      records: []
    };
    this.errorLog = {
      startTime: new Date().toISOString(),
      totalErrors: 0,
      records: []
    };
    this.failedRecords = [];
  }

  // Parse date from MM/DD/YYYY format to ISO string
  parseDate(dateString) {
    if (!dateString || dateString.trim() === '') return null;
    
    try {
      const [month, day, year] = dateString.trim().split('/');
      const date = new Date(year, month - 1, day);
      return date.toISOString();
    } catch (error) {
      console.warn(`Failed to parse date: ${dateString}`);
      return null;
    }
  }

  // Convert geometry to Polygon format (API only accepts Point or Polygon)
  convertGeometry(geojson) {
    let geometry = geojson.geometry || geojson;
    
    // If it's a FeatureCollection, take the first feature
    if (geojson.type === 'FeatureCollection' && geojson.features && geojson.features.length > 0) {
      geometry = geojson.features[0].geometry;
    }
    
    // If it's a Feature, extract geometry
    if (geojson.type === 'Feature') {
      geometry = geojson.geometry;
    }
    
    switch (geometry.type) {
      case 'Polygon':
        return geometry;
        
      case 'MultiPolygon':
        // Convert MultiPolygon to Polygon by taking the first polygon
        console.log(`Converting MultiPolygon to Polygon for better compatibility`);
        return {
          type: 'Polygon',
          coordinates: geometry.coordinates[0]
        };
        
      case 'Point':
        return geometry;
        
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }

  // Create payload for API
  createPayload(intervention) {
    const plantDate = this.parseDate(intervention.plantDate);
    
    if (!plantDate) {
      throw new Error('Invalid plant date');
    }
    
    const validSpecies = intervention.species.filter(s => s.valid && s.quantity > 0);
    if (validSpecies.length === 0) {
      throw new Error('No valid planted species found');
    }

    const plantedSpecies = validSpecies.map(species => ({
      otherSpecies: species.name,
      treeCount: species.quantity.toString()
    }));

    const geometry = this.convertGeometry(intervention.geojsonData);

    return {
      type: "multi-tree-registration",
      captureMode: "external",
      geometry: geometry,
      plantedSpecies: plantedSpecies,
      plantDate: plantDate,
      registrationDate: new Date().toISOString(),
      plantProject: this.config.plantProject
    };
  }

  // Upload single intervention
  async uploadSingleIntervention(payload) {
    const headers = {
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'authorization': `Bearer ${this.config.bearerToken}`,
      'content-type': 'application/json',
      'origin': 'https://dev.pp.eco',
      'priority': 'u=1, i',
      'referer': 'https://dev.pp.eco/',
      'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'tenant-key': this.config.tenantKey,
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'x-locale': 'en',
      'x-session-id': '28c88e70-78c8-11f0-8f0d-e3203c7c83fe'
    };

    try {
      const response = await axios.post(this.config.apiUrl, payload, { headers });
      return response.data;
    } catch (error) {
      // Handle CORS errors specifically
      if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
        throw new Error('CORS Error: The API may not allow browser requests. Consider using the Node.js script instead.');
      }
      throw error;
    }
  }

  // Log successful upload
  logSuccess(intervention, payload, response) {
    const successRecord = {
      folioNo: intervention.folioNo,
      timestamp: new Date().toISOString(),
      payload: payload,
      response: {
        id: response.id,
        hid: response.hid,
        treesPlanted: response.treesPlanted,
        plantProject: response.plantProject,
        plantDate: response.plantDate,
        registrationDate: response.registrationDate
      }
    };
    
    this.successLog.records.push(successRecord);
    this.successLog.totalSuccessful++;
  }

  // Log error
  logError(intervention, payload, error) {
    const errorRecord = {
      folioNo: intervention.folioNo,
      timestamp: new Date().toISOString(),
      payload: payload,
      error: {
        message: error.message,
        code: error.response?.status,
        details: error.response?.data
      }
    };
    
    this.errorLog.records.push(errorRecord);
    this.errorLog.totalErrors++;
    this.failedRecords.push(intervention);
  }

  // Upload all interventions
  async uploadInterventions(interventions, onProgress) {
    const validInterventions = interventions.filter(
      i => i.validation.isValid && !i.validation.needsGeoJSON
    );

    for (let i = 0; i < validInterventions.length; i++) {
      const intervention = validInterventions[i];
      
      // Update progress
      onProgress({ current: i, total: validInterventions.length });
      
      let payload = null;
      
      try {
        // Create payload
        payload = this.createPayload(intervention);
        
        // Upload intervention
        const response = await this.uploadSingleIntervention(payload);
        
        // Log success
        this.logSuccess(intervention, payload, response);
        
      } catch (error) {
        // Log error and continue
        this.logError(intervention, payload, error);
      }
      
      // Add delay between requests (1 second)
      if (i < validInterventions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Final progress update
    onProgress({ current: validInterventions.length, total: validInterventions.length });
    
    // Finalize logs
    this.successLog.endTime = new Date().toISOString();
    this.errorLog.endTime = new Date().toISOString();
    
    return {
      totalProcessed: validInterventions.length,
      successCount: this.successLog.totalSuccessful,
      errorCount: this.errorLog.totalErrors,
      successLog: this.successLog,
      errorLog: this.errorLog,
      failedRecords: this.failedRecords
    };
  }
}

export default InterventionUploader;