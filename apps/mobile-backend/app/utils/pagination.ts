export interface PaginationResult {
  limit: number;
  offset: number;
}

export interface PagingData<T> {
  totalItems: number;
  items: T[];
  totalPages: number;
  currentPage: number;
}

export const getPagination = (page?: number, size?: number): PaginationResult => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};

export const getPagingData = <T>(
  data: { count: number; rows: T[] },
  page?: number,
  limit: number = 10
): PagingData<T> => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);

  return { totalItems, items, totalPages, currentPage };
};
