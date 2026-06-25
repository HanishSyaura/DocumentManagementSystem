import { AuthBackend } from './AuthBackend';

export type ProjectCategory = {
  id: number;
  name: string;
  code?: string | null;
};

export type RegistryRecord = {
  id: string;
  fileCode: string;
  fileName: string;
  epcHex: string;
  epcScheme: string;
  trackingStatus: string | null;
  trackingUpdatedAt: string | null;
  generatedAt: string | null;
  documentStatus: string | null;
  document: {
    id: string | number;
    title: string;
    version: string;
    updatedAt: string | null;
    projectCategory: ProjectCategory | null;
    documentType: {
      name: string;
    } | null;
  } | null;
};

type RegistryLookupResponse = {
  enabled: boolean;
  records: RegistryRecord[];
};

type RegistryTrackingResponse = {
  record: RegistryRecord;
};

export const RegistryBackend = {
  async getProjectCategories(): Promise<ProjectCategory[]> {
    const data = await AuthBackend.getJson<{ projectCategories?: ProjectCategory[] }>('/system/config/project-categories');
    return Array.isArray(data?.projectCategories) ? data.projectCategories : [];
  },

  async getStatus(): Promise<{ enabled: boolean }> {
    return AuthBackend.getJson<{ enabled: boolean }>('/epc-registry/status');
  },

  async searchRecords(input: {
    projectCategoryId: number | string;
    query: string;
    limit?: number;
  }): Promise<RegistryLookupResponse> {
    const params = new URLSearchParams({
      projectCategoryId: String(input.projectCategoryId),
      query: String(input.query ?? '').trim(),
    });

    if (input.limit) {
      params.set('limit', String(input.limit));
    }

    return AuthBackend.getJson<RegistryLookupResponse>(`/epc-registry/search?${params.toString()}`);
  },

  async lookupByEpcHexes(input: {
    projectCategoryId: number | string;
    epcHexes: string[];
    limit?: number;
  }): Promise<RegistryLookupResponse> {
    return AuthBackend.postJson<RegistryLookupResponse>('/epc-registry/lookup', {
      projectCategoryId: Number(input.projectCategoryId),
      epcHexes: input.epcHexes,
      limit: input.limit,
    });
  },

  async updateTracking(
    action: 'check-in' | 'check-out' | 'archive',
    input: {
      epcHex?: string;
      fileCode?: string;
    },
  ): Promise<RegistryRecord> {
    const data = await AuthBackend.postJson<RegistryTrackingResponse>(`/epc-registry/tracking/${action}`, input);
    return data.record;
  },
};
