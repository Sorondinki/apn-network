import { supabase } from "./supabase";

// Mock Object don gamsar da tsofaffin API routes da ke kiran Prisma
export const prisma: any = new Proxy({}, {
  get: (target, prop) => {
    // Dawo da dummy functions idan ana kiran prisma.user.findUnique() da sauransu
    return new Proxy({}, {
      get: () => async () => null,
    });
  }
});

export class PrismaClient {
  constructor() {
    return prisma;
  }
}

export default prisma;