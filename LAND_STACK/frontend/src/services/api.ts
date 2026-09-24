import api from '../lib/api'
import type {
  ParcelSearchFilters,
  SatelliteScene,
  AIDetectionResult,
  GPSTelemetry,
  NavigationRoute,
} from '../types'

export const parcelService = {
  search: (filters: ParcelSearchFilters) =>
    api.get<any>('/parcels', { params: filters }),

  getByULPIN: (ulpin: string) =>
    api.get<any>(`/parcels/${ulpin}`),

  getGeojson: (ulpin: string) =>
    api.get<any>(`/parcels/${ulpin}/geojson`),

  getAllGeojson: () =>
    api.get<any>('/parcels/geojson'),
}

export const applicationService = {
  list: (filters?: { status?: string; userId?: string | number }) =>
    api.get<any>('/applications', { params: filters }),

  getById: (id: string | number) =>
    api.get<any>(`/applications/${id}`),

  create: (data: { type: string; ulpin: string; comments: string }) =>
    api.post<any>('/applications', data),

  updateStatus: (id: string | number, status: string, comments?: string) =>
    api.patch<any>(`/applications/${id}/status`, { status, comments }),

  getHistory: (id: string | number) =>
    api.get<any>(`/applications/${id}/history`),
}

export const userService = {
  profile: () => api.get<any>('/users/profile'),
  updateProfile: (data: any) => api.patch<any>('/users/profile', data),
}

export const anomalyService = {
  list: (parcelId?: string) =>
    api.get<any>('/anomalies', { params: { parcelId } }),

  resolve: (id: string | number) =>
    api.put<any>(`/anomalies/${id}/status`, { status: 'Resolved' }),
}

export const aiService = {
  getScenes: (ulpin: string) =>
    api.get<SatelliteScene[]>(`/ai/scenes/${ulpin}`),

  detectChange: (ulpin: string, hint?: string) =>
    api.post<AIDetectionResult>('/ai/detect-change', null, {
      params: { ulpin, detection_type_hint: hint },
    }),

  uploadSatelliteImage: (formData: FormData) =>
    api.post<{ message: string; image_id: number; image_url: string; ulpin: string }>(
      '/ai/upload-satellite-image',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),
}

export const gpsService = {
  getRoute: (data: {
    start_lat: number
    start_lon: number
    target_ulpin?: string
    dest_lat?: number
    dest_lon?: number
    mode?: string
  }) => api.post<NavigationRoute>('/gps/route', data),

  getActivePatrols: () => api.get<GPSTelemetry[]>('/gps/active-patrols'),

  sendTelemetry: (data: {
    device_id: string
    officer_name: string
    latitude: number
    longitude: number
    altitude?: number
    speed_kmh?: number
    heading_degrees?: number
    accuracy_meters?: number
    status?: string
    target_ulpin?: string
  }) => api.post<{ status: string; telemetry_id: number }>('/gps/telemetry', data),

  checkGeofence: (lat: number, lon: number, ulpin: string) =>
    api.post<{ ulpin: string; is_inside: boolean; distance_to_center_meters: number; geofence_status: string }>(
      '/gps/geofence-check',
      null,
      { params: { lat, lon, ulpin } }
    ),
}

export const databaseService = {
  getStatus: () =>
    api.get<{
      engine: string
      connection_uri_type: string
      postgis_status: string
      srid: number
      metrics: {
        total_parcels: number
        anomalies_logged: number
        satellite_scenes: number
        gps_telemetry_records: number
      }
      spatial_features_enabled: string[]
    }>('/database/status'),

  querySpatial: (lon: number, lat: number, radius_km: number = 2.0) =>
    api.post<{
      center_point: [number, number]
      radius_km: number
      parcels_found: number
      parcels: Array<{
        ulpin: string
        survey_number: string
        land_use: string
        area_sqm: number
        distance_meters: number
        center: [number, number]
      }>
    }>('/database/query-spatial', null, { params: { lon, lat, radius_km } }),
}
