import { Status } from "../../global/statuses";

export interface AdminCategory {
  id: string;
  categoryName: string;
  categoryDescription: string;
  categoryImage: string;
  totalProducts?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  categoryName: string;
  categoryDescription: string;
  categoryImage?: File | null;
}

export interface AdminCategoryState {
  categories: AdminCategory[];
  status: Status;
  actionLoading: boolean;
  error: string | null;
}
