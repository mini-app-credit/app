/**
 * Common Types
 * Shared type definitions used across the application
 */

/**
 * UUID string type
 * Represents a universally unique identifier
 */
export type UUID = string;

/**
 * ISO Date string type
 * Represents a date in ISO 8601 format
 */
export type ISODate = string;

/**
 * Generic ID type
 * Can be used for various entity identifiers
 */
export type ID = string | number;

/**
 * Result type
 * Represents a result of an operation
 */
export type Result<T, E = Error> = [error: null, data: T] | [error: E, data: null];

export type JWTToken = string;