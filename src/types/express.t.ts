// src/types/express.d.ts
import { UserRole } from './models'; // Import UserRole from your models.ts

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        county?: string; // Existing from your models.ts
        phone?: string; // <--- ADD THIS LINE
        // Add any other properties your JWT payload or user object might contain
        // e.g., email?: string; fullName?: string; etc.
      };
    }
  }
}