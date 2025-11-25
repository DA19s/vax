export interface NationalStats {
  summary: {
    totalChildren: number;
    totalVaccinations: number;
    totalRegions: number;
    totalHealthCenters: number;
    campaigns: number;
    coverageRate: number;
    criticalStocks: number;
  };
  monthlyVaccinations: { month: string; value: number }[];
  coverageByVaccine: { name: string; value: number; percentage: number }[];
  regionPerformance: {
    region: string;
    totalChildren: number;
    vaccinations: number;
    coverage: number;
  }[];
  top5BestRegions: {
    region: string;
    coverage: number;
  }[];
  top5WorstRegions: {
    region: string;
    coverage: number;
  }[];
}

export interface RegionDetailedStats {
  region: string;
  summary: {
    totalChildren: number;
    totalVaccinations: number;
    coverageRate: number;
    totalDistricts: number;
    overdueVaccinations: number;
  };
  districtStats: {
    district: string;
    districtType: string;
    totalChildren: number;
    vaccinations: number;
    coverage: number;
    agentsCount: number;
    active: boolean;
  }[];
  vaccineDistribution: { name: string; value: number }[];
  monthlyVaccinations: { month: string; value: number }[];
}

export interface DistrictDetailedStats {
  region: string;
  district: string;
  summary: {
    totalChildren: number;
    totalVaccinations: number;
    coverageRate: number;
    totalHealthCenters: number;
    activeHealthCenters: number;
    totalAgents: number;
    activeAgents: number;
    overdueVaccinations: number;
  };
  healthCenterStats: Array<{
    healthCenterId: string;
    healthCenterName: string;
    healthCenterType: string;
    totalChildren: number;
    vaccinations: number;
    coverage: number;
    agentsCount: number;
    activeAgentsCount: number;
    active: boolean;
  }>;
  monthlyVaccinations: Array<{
    month: string;
    value: number;
  }>;
  vaccineDistribution: Array<{
    name: string;
    value: number;
  }>;
}

export interface HealthCenterDetailedStats {
  region: string;
  district: string;
  healthCenter: string;
  healthCenterType: string;
  summary: {
    totalChildren: number;
    totalVaccinations: number;
    coverageRate: number;
    totalAgents: number;
    activeAgents: number;
    overdueVaccinations: number;
  };
  agentStats: Array<{
    agentId: string;
    agentName: string;
    agentEmail: string;
    agentPhone?: string;
    agentLevel?: string;
    active: boolean;
    vaccinations: number;
    childrenVaccinated: number;
    completedAppointments: number;
    missedAppointments: number;
    cancelledAppointments: number;
    successRate: number;
  }>;
  monthlyVaccinations: Array<{
    month: string;
    value: number;
  }>;
  vaccineDistribution: Array<{
    name: string;
    value: number;
  }>;
}

export interface VaccineStats {
  vaccineStats: {
    vaccineName: string;
    vaccineDescription?: string;
    ageInMonths?: number;
    totalDoses: number;
    scheduledDoses: number;
    overdueDoses: number;
    missedDoses: number;
    stockQuantity: number;
    completionRate: number;
    regionDistribution: { region: string; count: number }[];
    monthlyData: { month: string; value: number }[];
  }[];
}

export interface PerformanceIndicators {
  kpis: {
    totalVaccinations: number;
    scheduledVaccinations: number;
    overdueVaccinations: number;
    missedVaccinations: number;
    cancelledVaccinations: number;
    completionRate: number;
    appointmentSuccessRate: number;
    averageDelayDays: number;
    onTimeRate: number;
    onTimeCount: number;
    lateCount: number;
  };
  ageDistribution: {
    "0-6 mois": number;
    "6-12 mois": number;
    "1-2 ans": number;
    "2-5 ans": number;
    "5+ ans": number;
  };
  topAgents: {
    agentName: string;
    agentEmail: string;
    region?: string;
    healthCenter?: string;
    vaccinations: number;
  }[];
  criticalAlerts: {
    stocksLow: number;
    stocksOut: number;
    overdueVaccinations: number;
    inactiveAgents: number;
  };
}

export type TabType = "overview" | "regions" | "vaccines" | "performance";
export type DrillLevel = "national" | "region" | "district" | "healthcenter";
