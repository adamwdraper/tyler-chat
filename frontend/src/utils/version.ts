/**
 * This file contains version information for the Tyler Chat application.
 * It indicates which version of the Tyler package this chat application is compatible with.
 * 
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR VERSION INFORMATION
 * Update versions here only, and they will be propagated to the backend.
 */

import axios from 'axios';

// Local version information - SINGLE SOURCE OF TRUTH
export const TYLER_CHAT_VERSION = '0.7.0'; // The version of this chat application itself
export const TYLER_COMPATIBLE_VERSION = '0.7.0'; // Update this when testing with new Tyler versions

// Version information interface from backend
export interface VersionInfo {
  tyler_chat_version: string;
  expected_tyler_version: string;
  installed_tyler_version: string | null;
  is_compatible: boolean;
}

// File storage configuration interface
export interface FileStorageConfig {
  storage_type: string;
  storage_path: string;
  mount_path: string;
  storage_basename: string; // The basename of the storage path, used for link detection
}

// Get the API URL from environment variables or use default
export const getApiUrl = (): string => {
  // In a production environment, this would come from environment variables
  // For now, we'll use a default value
  return 'http://localhost:8000';
};

// Function to fetch version information from the backend
export const fetchVersionInfo = async (): Promise<VersionInfo> => {
  try {
    const apiUrl = getApiUrl();
    
    // Send the frontend version information to the backend
    // This ensures the backend always has the latest version information
    const response = await axios.get<VersionInfo>(`${apiUrl}/version`, {
      params: {
        frontend_version: TYLER_CHAT_VERSION,
        compatible_version: TYLER_COMPATIBLE_VERSION
      }
    });
    
    console.log('Version response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch version information:', error);
    // Return local version information if backend request fails
    return {
      tyler_chat_version: TYLER_CHAT_VERSION,
      expected_tyler_version: TYLER_COMPATIBLE_VERSION,
      installed_tyler_version: null,
      is_compatible: false
    };
  }
};

// Function to fetch file storage configuration from the backend
export const fetchFileStorageConfig = async (): Promise<FileStorageConfig> => {
  try {
    const apiUrl = getApiUrl();
    
    const response = await axios.get<FileStorageConfig>(`${apiUrl}/config/file-storage`);
    
    console.log('File storage config response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch file storage configuration:', error);
    // Return empty default configuration if backend request fails
    // The actual values will be determined by the backend based on environment variables
    return {
      storage_type: '',
      storage_path: '',
      mount_path: '',
      storage_basename: ''
    };
  }
}; 