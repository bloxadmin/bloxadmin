import { encodePath, request } from "./api";

export interface CreatePromoCode {
  attributes: Record<string, string>;
  uses?: number;
  active: boolean;
  starts?: string;
  expires?: string;
  fake?: boolean;
}

export interface PromoCode extends CreatePromoCode {
  code: string;
  used: number;
  created: string;
}

export const getPromoCodes = async (gameIdentifier: string, active: boolean) => {
  return await request<PromoCode[]>(encodePath`games/${gameIdentifier}/codes`, {
    searchParameters: { active: active ? "true" : "false" }
  });
};

export const createPromoCode = async (gameIdentifier: string, code: string, body: CreatePromoCode) => {
  return await request<PromoCode>(encodePath`games/${gameIdentifier}/codes/${code.trim()}`, {
    method: "PUT",
    body,
  });
}

export const deletePromoCode = async (gameIdentifier: string, code: string) => {
  return await request(encodePath`games/${gameIdentifier}/codes/${code.trim()}`, {
    method: "DELETE"
  });
}

export const updatePromoCode = async (gameIdentifier: string, code: string, body: Partial<CreatePromoCode>) => {
  return await request<PromoCode>(encodePath`games/${gameIdentifier}/codes/${code.trim()}`, {
    method: "PATCH",
    body
  });
}
