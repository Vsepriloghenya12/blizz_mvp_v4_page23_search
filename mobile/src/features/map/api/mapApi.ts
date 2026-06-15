import { apiRequest } from '../../../shared/api/client';
import type { MapFilter, MapObjectsResponse } from '../../../shared/api/types';

export async function getMapObjects(token: string, filter: MapFilter): Promise<MapObjectsResponse> {
  return apiRequest<MapObjectsResponse>(`/api/map/objects?filter=${filter}`, { token });
}
