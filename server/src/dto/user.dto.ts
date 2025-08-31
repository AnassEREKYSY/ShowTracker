import { z } from 'zod';

export const UserCreateDto = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().optional()
}).strict();
export type UserCreateDto = z.infer<typeof UserCreateDto>;
