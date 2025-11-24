import { UserRole } from "../types/roles";

export const isAdmin = (role: string): role is UserRole => role === UserRole.ADMIN;
export const isLecturer = (role: string): role is UserRole => role === UserRole.LECTURER;
export const isStudent = (role: string): role is UserRole => role === UserRole.STUDENT;