/**
 * ID Generator Utilities
 * Generates human-readable IDs for employees and clients
 */

import { Employee, Client } from '@/types';

/**
 * Generate Employee ID in format: S{YY}{NNN}
 * Example: S23006 (SweetFM, year 2023, 6th employee)
 * @param existingEmployees - Array of existing employees to determine next number
 * @param hireDate - Hire date to extract year
 */
export function generateEmployeeId(existingEmployees: Employee[], hireDate: string): string {
  const year = new Date(hireDate).getFullYear();
  const yearShort = year.toString().slice(-2); // Get last 2 digits (e.g., 23 for 2023)
  
  // Filter employees hired in the same year
  const employeesInYear = existingEmployees.filter(emp => {
    const empYear = new Date(emp.hireDate).getFullYear();
    return empYear === year;
  });
  
  // Get the next number (count + 1)
  const nextNumber = employeesInYear.length + 1;
  
  // Format number with leading zeros (e.g., 001, 006, 123)
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  
  return `S${yearShort}${formattedNumber}`;
}

/**
 * Generate Client ID in format: C{YY}{NNN}
 * Example: C24001 (Client, year 2024, 1st client)
 * @param existingClients - Array of existing clients to determine next number
 * @param createdDate - Creation date to extract year
 */
export function generateClientId(existingClients: Client[], createdDate: string): string {
  const year = new Date(createdDate).getFullYear();
  const yearShort = year.toString().slice(-2); // Get last 2 digits (e.g., 24 for 2024)
  
  // Filter clients created in the same year
  const clientsInYear = existingClients.filter(client => {
    const clientYear = new Date(client.createdAt).getFullYear();
    return clientYear === year;
  });
  
  // Get the next number (count + 1)
  const nextNumber = clientsInYear.length + 1;
  
  // Format number with leading zeros (e.g., 001, 012, 234)
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  
  return `C${yearShort}${formattedNumber}`;
}

/**
 * Validate Employee ID format
 * @param employeeId - ID to validate
 * @returns true if valid format (S{YY}{NNN})
 */
export function isValidEmployeeId(employeeId: string): boolean {
  const pattern = /^S\d{5}$/;
  return pattern.test(employeeId);
}

/**
 * Validate Client ID format
 * @param clientId - ID to validate
 * @returns true if valid format (C{YY}{NNN})
 */
export function isValidClientId(clientId: string): boolean {
  const pattern = /^C\d{5}$/;
  return pattern.test(clientId);
}

/**
 * Extract year from Employee ID
 * @param employeeId - Employee ID (e.g., S23006)
 * @returns Full year (e.g., 2023)
 */
export function getYearFromEmployeeId(employeeId: string): number | null {
  if (!isValidEmployeeId(employeeId)) return null;
  const yearShort = employeeId.substring(1, 3);
  const year = parseInt(yearShort, 10);
  // Assume 20xx for years 00-99
  return 2000 + year;
}

/**
 * Extract year from Client ID
 * @param clientId - Client ID (e.g., C24001)
 * @returns Full year (e.g., 2024)
 */
export function getYearFromClientId(clientId: string): number | null {
  if (!isValidClientId(clientId)) return null;
  const yearShort = clientId.substring(1, 3);
  const year = parseInt(yearShort, 10);
  // Assume 20xx for years 00-99
  return 2000 + year;
}

/**
 * Extract sequence number from Employee ID
 * @param employeeId - Employee ID (e.g., S23006)
 * @returns Sequence number (e.g., 6)
 */
export function getSequenceFromEmployeeId(employeeId: string): number | null {
  if (!isValidEmployeeId(employeeId)) return null;
  const sequence = employeeId.substring(3);
  return parseInt(sequence, 10);
}

/**
 * Extract sequence number from Client ID
 * @param clientId - Client ID (e.g., C24001)
 * @returns Sequence number (e.g., 1)
 */
export function getSequenceFromClientId(clientId: string): number | null {
  if (!isValidClientId(clientId)) return null;
  const sequence = clientId.substring(3);
  return parseInt(sequence, 10);
}
