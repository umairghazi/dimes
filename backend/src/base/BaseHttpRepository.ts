import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { HttpRepositoryError } from "../errors/HttpRepositoryError";

export abstract class BaseHttpRepository {
  protected readonly client: AxiosInstance;

  constructor(baseURL: string, defaultHeaders: Record<string, string> = {}) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: { "Content-Type": "application/json", ...defaultHeaders },
    });

    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err.response?.status ?? 500;
        const message = err.response?.data?.message ?? err.message ?? "HTTP request failed";
        throw new HttpRepositoryError(message, status, "request", err);
      },
    );
  }

  protected async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.get<T>(path, config);
    return res.data;
  }

  protected async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.post<T>(path, data, config);
    return res.data;
  }

  protected async put<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.put<T>(path, data, config);
    return res.data;
  }

  protected async patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.patch<T>(path, data, config);
    return res.data;
  }

  protected async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.delete<T>(path, config);
    return res.data;
  }
}
