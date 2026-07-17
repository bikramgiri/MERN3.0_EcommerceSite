import type { Status } from "../global/statuses";

export interface Category{
      id?: string,
      categoryName: string,
      categoryDescription?: string
      categoryImage?: string;
      totalProducts?: number;
}

export interface CategoryState{
      categories: Category[],
      status: Status
}
