export type CurrencyType = 'banknote' | 'coin';
export type CurrencyMode = 'auto' | 'banknote' | 'coin';

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  device?: string;
  gpu_available?: boolean;
  gpu_name?: string | null;
}

export interface ModelStatusResponse {
  loaded: boolean;
  checkpoint_exists?: boolean;
  device?: string;
  gpu_name?: string | null;
  model_name: string | null;
  architecture: string;
  num_classes: number | null;
  classes: string[] | null;
  checkpoint_path: string | null;
  val_accuracy?: number | null;
  best_epoch?: number | null;
  message: string;
}

export interface MetricsSummaryResponse {
  available: boolean;
  total_recognitions: number;
  recognized_count?: number;
  rejected_count?: number;
  total_recognized_value?: number;
  average_confidence: number | null;
  average_latency_ms: number | null;
  model_accuracy: number | null;
  macro_f1?: number | null;
  confusion_matrix?: number[][] | null;
  per_class_metrics?: Record<
    string,
    { precision: number; recall: number; f1_score: number; support: number }
  > | null;
  training_history?: Array<{
    epoch: number;
    train_loss: number;
    train_accuracy: number;
    val_loss: number;
    val_accuracy: number;
    lr?: number;
    epoch_seconds?: number;
  }> | null;
  classes?: string[] | null;
  message: string;
}

export interface RecognitionRecord {
  id: string;
  timestamp: string;
  image_filename: string;
  predicted_denomination: string | null;
  confidence: number | null;
  inference_ms: number | null;
  device?: string | null;
  alternatives?: { label: string; score: number }[] | null;
  has_gradcam?: boolean;
  currency_type?: CurrencyType;
  safety_status?: string;
  safety_concern?: boolean;
  model_version?: string | null;
}

export interface HistoryResponse {
  records: RecognitionRecord[];
  total: number;
  message: string;
}

export interface ImageQualityAssessment {
  is_usable: boolean;
  is_blurry: boolean;
  blur_score: number;
  mean_luminance: number;
  is_too_dark: boolean;
  is_too_bright: boolean;
  is_poorly_lit: boolean;
  resolution: string;
  aspect_ratio: number;
  framing_concern: string | null;
  guidance_message: string;
  guidance_en: string;
  guidance_ta: string;
  guidance_hi: string;
}

export interface CurrencySafetyCheck {
  denomination: string;
  currency_type: CurrencyType;
  recognized: boolean;
  confidence: number;
  is_low_confidence: boolean;
  legal_tender: boolean;
  circulation_status: 'active_circulation' | 'withdrawn_legal_tender' | 'demonetized';
  status_label: string;
  rbi_summary: string;
  checked_date: string;
  physical_features_to_check: string[];
  tactile_guide_for_visually_impaired: string;
  authenticity_advisory: string;
  observable_anomaly_detected: boolean;
  anomaly_reasons: string[];
}

export interface PredictionResponse {
  success: boolean;
  predicted_denomination: string;
  currency_type: CurrencyType;
  confidence: number;
  confidence_percentage: string;
  inference_ms: number;
  backend_processing_ms?: number;
  device: string;
  alternatives: { label: string; score: number }[];
  gradcam_base64?: string | null;
  is_low_confidence?: boolean;
  is_currency?: boolean;
  rejected?: boolean;
  rejection_reason?: string | null;
  record_id?: string | null;
  message: string;
  guidance_message?: string;
  image_quality?: ImageQualityAssessment;
  safety_check?: CurrencySafetyCheck;
}

export interface CurrencyStatusResponse {
  denomination: string;
  currency_type: CurrencyType;
  series: string | null;
  legal_tender: boolean;
  circulation_status: string;
  status_label: string;
  base_color: string | null;
  dimensions_mm: string | null;
  reverse_motif: string | null;
  legal_basis: string | null;
  rbi_summary: string;
  physical_security_features: string[];
  tactile_features_visually_impaired: string | null;
  authenticity_advisory: string;
  checked_date: string;
}

export interface SystemTelemetry {
  gpu_name: string | null;
  gpu_utilization_pct: number;
  gpu_temp_c: number;
  gpu_memory_used_mb: number;
  gpu_memory_total_mb: number;
  cpu_utilization_pct: number;
  ram_used_mb: number;
  ram_total_mb: number;
  ram_utilization_pct: number;
  cuda_available: boolean;
}

export interface TrainingLogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface EpochRecord {
  epoch: number;
  train_loss: number;
  train_accuracy: number;
  val_loss: number;
  val_accuracy: number;
  lr: number;
  epoch_seconds: number;
}

export interface EvaluationResults {
  overall_accuracy: number;
  macro_f1: number;
  total_test_samples: number;
  classes: string[];
  confusion_matrix: number[][];
  per_class_metrics: Record<
    string,
    { precision: number; recall: number; f1_score: number; support: number }
  >;
  checkpoint_evaluated?: string;
  device?: string;
}

export interface TrainingStatusResponse {
  job_id: string | null;
  state: 'idle' | 'preparing' | 'running' | 'stopping' | 'completed' | 'failed' | 'interrupted';
  is_running: boolean;
  error_message: string | null;
  config: {
    splits_dir?: string;
    epochs?: number;
    batch_size?: number;
    lr?: number;
    optimizer?: string;
    patience?: number;
    device?: string;
    architecture?: string;
  };
  current_epoch: number;
  total_epochs: number;
  train_loss: number;
  train_acc: number;
  val_loss: number;
  val_acc: number;
  best_val_acc: number;
  best_epoch: number;
  learning_rate: number;
  elapsed_seconds: number;
  epoch_duration: number;
  estimated_remaining_seconds: number;
  history: EpochRecord[];
  recent_logs: TrainingLogEntry[];
  detected_classes: string[];
  telemetry: SystemTelemetry;
  active_model: string | null;
  evaluation_results: EvaluationResults | null;
}

export interface DatasetAuditResponse {
  dataset_path: string;
  exists: boolean;
  total_images_found: number;
  valid_images: number;
  corrupt_images: number;
  duplicate_images: number;
  class_counts: Record<string, number>;
  corrupt_files: Array<{ file: string; error: string }>;
  duplicate_groups: string[][];
  ready_for_training: boolean;
  message: string;
}

export interface CheckpointInfo {
  filename: string;
  path: string;
  epoch: number | null;
  val_accuracy: number | null;
  classes: string[];
  num_classes: number | null;
  size_mb: number;
  is_active: boolean;
  timestamp?: string;
}

export type TextSizeOption = 'standard' | 'large' | 'xlarge';
export type SpeechLanguage =
  | 'en'
  | 'ta'
  | 'hi'
  | 'te'
  | 'kn'
  | 'ml'
  | 'bn'
  | 'mr'
  | 'gu'
  | 'pa'
  | 'or'
  | 'ur'
  | 'as';

export interface AppSettings {
  speechEnabled: boolean;
  speechLanguage: SpeechLanguage;
  speechRate?: 'slow' | 'normal' | 'fast';
  muteDuringScanning?: boolean;
  repeatLastResult?: boolean;
  textSize: TextSizeOption;
  highContrast: boolean;
  reducedMotion: boolean;
  vibrationEnabled: boolean;
  voiceCommandsEnabled: boolean;
  userName?: string;
  deviceName?: string;
  deviceId?: string;
  userOnboarded?: boolean;
  autoScanEnabled: boolean;
}

export interface ConnectedDevice {
  client_id: string;
  client_type: string;
  device_name?: string | null;
  ip_address: string;
  last_seen: string;
  last_seen_timestamp: number;
  total_requests: number;
  last_action: string;
  user_agent?: string;
  is_active: boolean;
}

