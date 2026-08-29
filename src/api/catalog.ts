import { apiRequest } from './client';

export interface Brand {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  nameUrdu: string;
}

export interface Vehicle {
  id: string;
  name: string;
}

export const catalogApi = {
  brands: {
    list: () => apiRequest<Brand[]>('/catalog/brands'),
    create: (name: string) =>
      apiRequest<Brand>('/catalog/brands', { method: 'POST', body: { name } }),
    update: (id: string, name: string) =>
      apiRequest<Brand>(`/catalog/brands/${id}`, { method: 'PATCH', body: { name } }),
    remove: (id: string) =>
      apiRequest<void>(`/catalog/brands/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => apiRequest<Category[]>('/catalog/categories'),
    create: (name: string, nameUrdu = '') =>
      apiRequest<Category>('/catalog/categories', {
        method: 'POST',
        body: { name, nameUrdu },
      }),
    update: (id: string, body: { name?: string; nameUrdu?: string }) =>
      apiRequest<Category>(`/catalog/categories/${id}`, { method: 'PATCH', body }),
    remove: (id: string) =>
      apiRequest<void>(`/catalog/categories/${id}`, { method: 'DELETE' }),
  },
  vehicles: {
    list: () => apiRequest<Vehicle[]>('/catalog/vehicles'),
    create: (name: string) =>
      apiRequest<Vehicle>('/catalog/vehicles', { method: 'POST', body: { name } }),
    update: (id: string, name: string) =>
      apiRequest<Vehicle>(`/catalog/vehicles/${id}`, { method: 'PATCH', body: { name } }),
    remove: (id: string) =>
      apiRequest<void>(`/catalog/vehicles/${id}`, { method: 'DELETE' }),
  },
};
