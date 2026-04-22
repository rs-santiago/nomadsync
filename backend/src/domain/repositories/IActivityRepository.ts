export interface CreateActivityData {
  title: string;
  type: string;
  destinationId: string;
}

export interface IActivityRepository {
  create(data: CreateActivityData): Promise<any>;
  delete(id: string): Promise<void>;
}