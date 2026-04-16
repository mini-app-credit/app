/* eslint-disable @typescript-eslint/no-empty-object-type */
/**
 * Utility types for advanced TypeScript patterns
 */

// Deep partial - makes all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Deep readonly - makes all properties readonly recursively
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Extract keys of specific type
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Require at least one property
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// Require exactly one property
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

// Non-empty array
export type NonEmptyArray<T> = [T, ...T[]];

// Constructor type
export type Constructor<T = {}> = new (...args: any[]) => T;

// Abstract constructor type
export type AbstractConstructor<T = {}> = abstract new (...args: any[]) => T;

// Function type
export type Func<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => TReturn;

// Async function type
export type AsyncFunc<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => Promise<TReturn>;

// Value of object type
export type ValueOf<T> = T[keyof T];

// Mutable type - removes readonly
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Brand type for nominal typing
export type Brand<T, TBrand> = T & { __brand: TBrand };

// Opaque type for nominal typing
export type Opaque<T, TToken = unknown> = T & { readonly __opaque__: TToken };