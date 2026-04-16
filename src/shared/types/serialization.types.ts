/**
 * Serialization types for data transfer and persistence
 */

import { ISODate } from './common.types';

// JSON serializable primitive types
export type JsonPrimitive = string | number | boolean | null | undefined;

// JSON serializable object
export type JsonObject = { [key: string]: JsonValue };

// JSON serializable array
export type JsonArray = JsonValue[];

// JSON serializable value
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// Serialized entity - converts Dates to ISO strings
export type SerializedEntity<T> = {
  [K in keyof T]: T[K] extends Date
    ? ISODate
    : T[K] extends Date | undefined
    ? ISODate | undefined
    : T[K] extends Date | null
    ? ISODate | null
    : T[K] extends object
    ? SerializedEntity<T[K]>
    : T[K];
};

// Database record type - represents raw database data
export type DatabaseRecord<T> = SerializedEntity<T> & {
  id: string;
  created_at: ISODate;
  updated_at: ISODate;
};

// API response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: number;
    message: string;
    details?: Record<string, any>;
    timestamp: ISODate;
    path?: string;
  };
  meta?: {
    timestamp: ISODate;
    version?: string;
    [key: string]: any;
  };
}

// Event payload type
export type EventPayload = Record<string, JsonValue>;

// Serializable domain event
export interface SerializableDomainEvent {
  eventId: string;
  aggregateId: string;
  eventType: string;
  payload: EventPayload;
  metadata: {
    timestamp: ISODate;
    version: number;
    correlationId?: string;
    [key: string]: JsonValue;
  };
}