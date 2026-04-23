export interface CreateActivityData {
  title: string;
  type: string;
  destinationId: string;
  category?: string;
  description?: string;
  isAiGenerated?: boolean;
}

export interface IActivityRepository {
  create(data: CreateActivityData): Promise<any>;
  delete(id: string): Promise<void>;
}