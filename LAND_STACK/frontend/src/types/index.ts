export interface User {
  id: string | number
  email: string
  name: string
  role: 'citizen' | 'officer' | 'admin'
  token?: string
  createdAt?: string
}

export interface Parcel {
  ulpin: string
  survey_number?: string
  surveyNumber?: string
  area: number
  land_use?: string
  landUse?: string
  district?: string
  taluk?: string
  village?: string
  state?: string
  geometry?: any
  ownership_records?: OwnershipRecord[]
  tax_records?: TaxRecord[]
  registrations?: RegistrationRecord[]
  encumbrances?: EncumbranceRecord[]
  documents?: DocumentRecord[]
  applications?: Application[]
  anomalies?: AnomalyAlert[]
  basicInfo?: BasicParcelInfo
  created_at?: string
}

export interface BasicParcelInfo {
  ulpin: string
  surveyNumber: string
  area: number
  landUse: string
  district: string
  taluk: string
  village: string
  state: string
}

export interface OwnershipRecord {
  id: string | number
  owner_name?: string
  ownerName?: string
  share?: number
  ownershipPercentage?: number
  rorNumber?: string
  rorDate?: string
  documentUrl?: string
}

export interface TaxRecord {
  id: string | number
  parcel_ulpin?: string
  assessment_year?: number
  year?: number
  tax_amount?: number
  taxAmount?: number
  paid_date?: string
  paidDate?: string
  status: string
}

export interface RegistrationRecord {
  id: string | number
  registration_number?: string
  registrationNumber?: string
  registration_date?: string
  registrationDate?: string
  documentType?: string
  consideration_amount?: number
  value?: number
}

export interface EncumbranceRecord {
  id: string | number
  type: string
  description: string
  start_date?: string
  date?: string
  status?: string
  amount?: number
}

export interface DocumentRecord {
  id: string | number
  title?: string
  name?: string
  document_type?: string
  type?: string
  file_path?: string
  url?: string
  created_at?: string
  uploadedAt?: string
}

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'escalated' | string

export interface Application {
  id: string | number
  type: string
  ulpin: string
  status: string
  applicant_id?: number | string
  submittedBy?: string
  submitted_at?: string
  submittedAt?: string
  updatedAt?: string
  comments?: string
  statusHistory?: StatusHistoryEntry[]
  parcel?: Parcel
}

export interface StatusHistoryEntry {
  id: string | number
  status: string
  comments: string
  changed_by?: number | string
  updatedBy?: string
  changed_at?: string
  updatedAt?: string
}

export interface AnomalyAlert {
  id: string | number
  ulpin?: string
  parcelId?: string
  detection_type?: string
  type?: string
  description: string
  confidence_score?: number
  affected_area_sqm?: number
  change_percentage?: number
  severity?: 'low' | 'medium' | 'high' | 'critical'
  detected_at?: string
  detectedAt?: string
  status: string
  image_before_path?: string
  image_after_path?: string
  diff_heatmap_path?: string
}

export interface SatelliteScene {
  id: number
  ulpin: string
  scene_date: string
  sensor_name: string
  resolution_meters: number
  cloud_coverage: number
  image_path: string
  image_type: string
}

export interface AIDetectionResult {
  change_detected: boolean
  detection_type: string
  confidence_score: number
  affected_area_sqm: number
  change_percentage: number
  changed_pixel_count?: number
  description: string
  recommendation: string
  before_image_url: string
  after_image_url: string
  diff_heatmap_url: string
  bounding_boxes?: Array<{
    x_min: number
    y_min: number
    x_max: number
    y_max: number
    width: number
    height: number
  }>
  anomaly_id?: number
  detected_at: string
}

export interface GPSTelemetry {
  id?: number
  device_id: string
  officer_name: string
  latitude: number
  longitude: number
  altitude?: number
  speed_kmh: number
  heading_degrees: number
  accuracy_meters?: number
  status: string
  target_ulpin?: string
  timestamp: string
}

export interface TurnManeuver {
  step: number
  type: string
  instruction: string
  distance_meters: number
  duration_seconds: number
  bearing: number
  location: [number, number]
}

export interface NavigationRoute {
  destination: string
  total_distance_meters: number
  total_distance_km: number
  eta_minutes: number
  eta_seconds: number
  travel_mode: string
  bearing_degrees: number
  cardinal_direction: string
  route_geojson: {
    type: string
    geometry: {
      type: string
      coordinates: number[][]
    }
    properties: Record<string, any>
  }
  maneuvers: TurnManeuver[]
}

export interface ParcelSearchFilters {
  ulpin?: string
  surveyNumber?: string
  search?: string
  landUse?: string
  land_use?: string
  district?: string
  taluk?: string
  village?: string
}

export interface ApiResponse<T> {
  success?: boolean
  data: T
  message?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'citizen' | 'officer'
}

export interface AuthResponse {
  user: User
  token: string
}
