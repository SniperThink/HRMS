export interface DateRange {
  start: Date;
  end: Date;
  type?: string;
}

export interface FilterState {
  dateRange: DateRange;
  category: string;
  timePeriod: string;
  department: string;
  employee: string;
  status: string;
  date: string;
  year: string;
}

export interface MetricCard {
  title: string;
  value: number | string;
  trend: number;
  icon: string;
  subtitle?: string;
  trendLabel?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

export interface MenuItem {
  icon: string;
  label: string;
  path: string;
  target?: string;  // Make target optional (this allows it to be '_blank' or undefined)
}

export interface TabItem {
  icon: string;
  label: string;
  id: string;
}