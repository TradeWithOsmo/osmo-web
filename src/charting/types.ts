// Chart types and interfaces
export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SymbolInfo {
  name: string;
  description: string;
  type: string;
  session: string;
  timezone: string;
  ticker: string;
  exchange: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_no_volume: boolean;
  supported_resolutions: string[];
  volume_precision: number;
  data_status: string;
}

export interface DatafeedConfiguration {
  supports_search: boolean;
  supports_group_request: boolean;
  supported_resolutions: string[];
  supports_marks: boolean;
  supports_timescale_marks: boolean;
  supports_time: boolean;
}