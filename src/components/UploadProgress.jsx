import React from 'react';
import { CheckCircle, XCircle, Loader, Upload } from 'lucide-react';

const UploadProgress = ({ progress, isUploading }) => {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            {isUploading ? (
              <Loader className="h-8 w-8 text-blue-600 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-blue-600" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            {isUploading ? 'Uploading Interventions...' : 'Preparing Upload'}
          </h2>
          
          <p className="text-gray-600 mb-8">
            {isUploading 
              ? `Processing record ${progress.current} of ${progress.total}`
              : 'Getting ready to upload your interventions'
            }
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{progress.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{progress.current}</div>
              <div className="text-sm text-gray-600">Processed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-500">{progress.total - progress.current}</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>

          {/* Rate Limit Info */}
          {isUploading && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <div className="font-medium">Upload in progress</div>
                <div className="text-blue-700 mt-1">
                  Processing with 1 second delay between requests to respect rate limits
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;