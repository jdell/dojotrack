-- Add ADMIN role to the Role enum
ALTER TYPE "Role" ADD VALUE 'ADMIN' BEFORE 'INSTRUCTOR';
