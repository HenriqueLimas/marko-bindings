export type Filter = "all" | "active" | "complete";

export interface Task {
  id: number;
  title: string;
  complete: boolean;
}
