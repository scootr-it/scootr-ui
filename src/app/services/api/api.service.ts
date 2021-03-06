import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

interface IApiServiceResponse<T>
{
  status: number,
  success: boolean,
  data?: T,
  errors?: {
    field: string,
    error: string,
  }[],
}

interface ILocation
{
  latitude: number,
  longitude: number,
}

export interface IExport
{
  id: string,
  user: IUser,
  data: any,
  created_at: string,
  completed_at: string | null,
  expires_at: string | null,
}

export interface IPaymentMethod
{
  id: string,
  type: string,
  data: any,
  wallet: IWallet,
  __metadata?: {
    is_default: boolean,
  },
}

export interface IRide
{
  id: string,
  vehicle: IVehicle,
  wallet: IWallet,
  start_time: string,
  end_time: string | null,
  amount: number | null,
}

export interface IRideWaypoint
{
  id: string,
  ride: IRide,
  location: ILocation,
  timestamp: string,
}

export interface ISession
{
  id: string,
  user: IUser,
  expires_at: string,
}

export interface ISubscription
{
  id: string,
  amount: number,
  wallet: IWallet,
  status: string,
  current_period_end: string,
  cancel_at_period_end: boolean,
  deleted: boolean,
}

export interface ITransaction
{
  id: string,
  amount: number,
  wallet: IWallet,
  timestamp: string,
  reason: string,
  external_id: string,
}

export interface IUser
{
  id: string,
  first_name: string,
  last_name: string,
  email: string,
  birth_date: string,
  fiscal_number: string,
}

export interface IVehicle
{
  id: string,
  battery_level: number,
  location: ILocation,
}

export interface IWallet
{
  id: string,
  name: string,
  balance: number,
  user: IUser,
  __metadata?: {
    is_default: boolean,
  },
}

@Injectable({
  providedIn: 'root'
})
export class ApiService
{
  constructor()
  {}

  private async send(
    method: "DELETE" | "GET" | "PATCH" | "POST" | "PUT",
    url: string,
    body?: any,
  ): Promise<IApiServiceResponse<any>>
  {
    const response = await fetch(`${environment.api.endpoint}/${url}`, {
      method,
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("session.id")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result: IApiServiceResponse<any> = {
      status: response.status,
      success: response.status >= 200 && response.status < 300,
    };

    // No Content
    if (result.status === 204)
    {
      return result;
    }

    const json = await response.json();

    if (response.status !== 200)
    {
      result.errors = json.details;
    }
    else
    {
      result.data = json;
    }

    return result;
  }

  /* ----------
  -- EXPORTS --
  ---------- */

  public async retrieveExport(id: string): Promise<IApiServiceResponse<IExport>>
  {
    return this.send("GET", `exports/${id}`);
  }

  public async createExport(userId: string): Promise<IApiServiceResponse<IExport>>
  {
    return this.send("POST", `users/${userId}/exports`);
  }

  /* ------------------
  -- PAYMENT METHODS --
  ------------------ */

  public async listPaymentMethodsForWallet(walletId: string): Promise<IApiServiceResponse<IPaymentMethod[]>>
  {
    return this.send("GET", `wallets/${walletId}/payment-methods`);
  }

  public async addPaymentMethodToWallet(stripePaymentMethodId: string, walletId: string): Promise<IApiServiceResponse<IUser>>
  {
    return this.send("POST", `wallets/${walletId}/payment-methods`, {
      id: stripePaymentMethodId,
    });
  }

  public async setDefaultPaymentMethodForWallet(paymentMethodId: string, walletId: string): Promise<IApiServiceResponse<void>>
  {
    return this.send("PUT", `wallets/${walletId}/payment-methods/default`, {
      id: paymentMethodId,
    });
  }

  public async deletePaymentMethod(id: string): Promise<IApiServiceResponse<void>>
  {
    return this.send("DELETE", `payment-methods/${id}`);
  }

  /* --------
  -- RIDES --
  -------- */

  public async retrieveRide(id: string): Promise<IApiServiceResponse<IRide>>
  {
    return this.send("GET", `rides/${id}`);
  }

  public async listWaypointsForRide(id: string): Promise<IApiServiceResponse<IRideWaypoint[]>>
  {
    return this.send("GET", `rides/${id}/waypoints`);
  }

  public async listRidesForUser(userId: string): Promise<IApiServiceResponse<IRide[]>>
  {
    return this.send("GET", `users/${userId}/rides`);
  }

  public async retrieveActiveRide(userId: string): Promise<IApiServiceResponse<IRide | null>>
  {
    return this.send("GET", `users/${userId}/rides/active`);
  }

  public async startRide(data: {
    vehicle: string,
    wallet: string,
  }): Promise<IApiServiceResponse<IRide>>
  {
    return this.send("POST", "rides", data);
  }

  public async endRide(id: string): Promise<IApiServiceResponse<IRide>>
  {
    return this.send("POST", `rides/${id}/end`);
  }

  /* -----------
  -- SESSIONS --
  ----------- */

  public async retrieveSession(id: string): Promise<IApiServiceResponse<ISession>>
  {
    return this.send("GET", `sessions/${id}`);
  }

  public async deleteSession(id: string): Promise<IApiServiceResponse<void>>
  {
    return this.send("DELETE", `sessions/${id}`);
  }

  /* ----------------
  -- SUBSCRIPTIONS --
  ---------------- */

  public async listSubscriptionsForWallet(walletId: string): Promise<IApiServiceResponse<ISubscription[]>>
  {
    return this.send("GET", `wallets/${walletId}/subscriptions`);
  }

  /* ---------------
  -- TRANSACTIONS --
  --------------- */

  public async listTransactionsForWallet(walletId: string): Promise<IApiServiceResponse<ITransaction[]>>
  {
    return this.send("GET", `wallets/${walletId}/transactions`);
  }

  /* --------
  -- USERS --
  -------- */

  public async retrieveUser(id: string): Promise<IApiServiceResponse<IUser>>
  {
    return this.send("GET", `users/${id}`);
  }

  public async createUser(data: {
    first_name: string,
    last_name: string,
    email: string,
    birth_date: string,
    fiscal_number: string,
  }): Promise<IApiServiceResponse<IUser>>
  {
    return this.send("POST", "users", data);
  }

  public async updateUser(id: string, data: {
    email?: string,
  }): Promise<IApiServiceResponse<IUser>>
  {
    return this.send("PATCH", `users/${id}`, data);
  }

  public async deleteUser(id: string): Promise<IApiServiceResponse<void>>
  {
    return this.send("DELETE", `users/${id}`);
  }

  /* -----------
  -- VEHICLES --
  ----------- */

  public async listVehiclesNearLocation(
    location: {
      latitude: number,
      longitude: number,
    },
    radius: number,
  ): Promise<IApiServiceResponse<IVehicle[]>>
  {
    return this.send("GET", `vehicles?location[latitude]=${location.latitude}&location[longitude]=${location.longitude}&radius=${radius}`);
  }

  /* ----------
  -- WALLETS --
  ---------- */

  public async listWalletsForUser(userId: string): Promise<IApiServiceResponse<IWallet[]>>
  {
    return this.send("GET", `users/${userId}/wallets`);
  }

  public async retrieveWallet(walletId: string): Promise<IApiServiceResponse<IWallet>>
  {
    return this.send("GET", `wallets/${walletId}`);
  }

  public async createBillingPortalSession(walletId: string): Promise<IApiServiceResponse<{ url: string }>>
  {
    return this.send("GET", `wallets/${walletId}/stripe/billing-portal`);
  }

  public async createWalletForUser(data: {
    name: string,
  }, userId: string): Promise<IApiServiceResponse<IWallet>>
  {
    return this.send("POST", `users/${userId}/wallets`, data);
  }

  public async addFundsToWallet(walletId: string, data: {
    amount: number,
    is_subscription: boolean,
  }): Promise<IApiServiceResponse<{ client_secret: string }>>
  {
    return this.send("POST", `wallets/${walletId}/funds`, data);
  }

  public async updateWallet(walletId: string, data: {
    name?: string,
  }): Promise<IApiServiceResponse<IWallet>>
  {
    return this.send("PATCH", `wallets/${walletId}`, data);
  }

  public async setDefaultWalletForUser(walletId: string, userId: string): Promise<IApiServiceResponse<void>>
  {
    return this.send("PUT", `users/${userId}/wallets/default`, { id: walletId });
  }

  public async deleteWallet(walletId: string): Promise<IApiServiceResponse<void>>
  {
    return this.send("DELETE", `wallets/${walletId}`);
  }
}
