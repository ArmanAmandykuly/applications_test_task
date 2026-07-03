const BASE_URL = "http://127.0.0.1:8000/api/v1"; // Make sure this matches your FastAPI port!

export interface ApplicationCreate {
  title: string;
  description: string;
  priority: "low" | "normal" | "high";
}

export interface ApplicationUpdate {
  status: "new" | "in_progress" | "done";
}

export interface ApplicationResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export class ApiClient {
  // Utility to grab credentials for the DELETE request if logged in
  private static getAuthHeader(): string | null {
    const storedAuth = localStorage.getItem("basic_auth_token");
    return storedAuth ? `Basic ${storedAuth}` : null;
  }

  // Encodes username/password to standard HTTP Basic Auth format
  public static login(username: string, password: string): void {
    const token = btoa(`${username}:${password}`);
    localStorage.setItem("basic_auth_token", token);
  }

  public static logout(): void {
    localStorage.removeItem("basic_auth_token");
  }

  // GET /applications/
  public static async listApplications(): Promise<ApplicationResponse[]> {
    const response = await fetch(`${BASE_URL}/applications/`, {
      method: "GET",
    });
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    return response.json();
  }

  // POST /applications/
  public static async createApplication(
    app: ApplicationCreate,
  ): Promise<ApplicationResponse> {
    const response = await fetch(`${BASE_URL}/applications/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(app),
    });
    if (!response.ok)
      throw new Error(`Creation failed: ${response.statusText}`);
    return response.json();
  }

  // PATCH /applications/:id
  public static async updateApplicationStatus(
    id: string,
    update: ApplicationUpdate,
  ): Promise<ApplicationResponse> {
    const response = await fetch(`${BASE_URL}/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok) throw new Error(`Update failed: ${response.statusText}`);
    return response.json();
  }

  // DELETE /applications/:id
  public static async deleteApplication(id: string): Promise<void> {
    const authHeader = this.getAuthHeader();
    if (!authHeader) throw new Error("Unauthorized: Admin credentials missing");

    const response = await fetch(`${BASE_URL}/applications/${id}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });

    // Handle the clean 204 No Content status code safely
    if (response.status === 204) return;
    if (!response.ok)
      throw new Error(`Deletion failed: ${response.statusText}`);
  }
}
