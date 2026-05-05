export interface UserRoleData {
  id: string;
  email: string;
  fullName: string;
  role: "Admin" | "Operator" | "Client";
  isActive: boolean;
  clientId: string | null;
}
