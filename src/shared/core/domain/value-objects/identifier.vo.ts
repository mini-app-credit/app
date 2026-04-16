import { nanoid } from "nanoid";
import { UUID_REGEX } from "../constants";
import { BaseValueObject } from "./base.vo";
import { v4 as uuidv4 } from 'uuid';

export class UUIDIdentifier extends BaseValueObject<string> {
    private static readonly UUID_REGEX = UUID_REGEX;
    constructor(value: string) {
        super(value);
    }

    public static create(value: string): UUIDIdentifier {
        return new UUIDIdentifier(value);
    }

    protected validate(value: string): void {
        if (!value) {
            throw this.createValidationError('UUIDIdentifier cannot be empty', 'UUIDIdentifier');
        }

        if (typeof value !== 'string') {
            throw this.createValidationError('UUIDIdentifier must be a string', 'UUIDIdentifier');
        }

        if (!UUIDIdentifier.isValid(value)) {
            throw this.createValidationError('UUIDIdentifier must be a valid UUID format', 'UUIDIdentifier');
        }
    }

    public static isValid(value: string): boolean {
        return typeof value === 'string' && UUIDIdentifier.UUID_REGEX.test(value);
    }

    public toValue(): string {
        return this.value;
    }

    public static generate(): UUIDIdentifier {
        return new UUIDIdentifier(uuidv4());
    }
}

export class NumberIdentifier extends BaseValueObject<number> {
    constructor(value: number) {
        super(value);
    }

    public static create(value: number): NumberIdentifier {
        return new NumberIdentifier(value);
    }

    protected validate(value: number): void {
        if (!value) {
            throw this.createValidationError('NumberIdentifier cannot be empty', 'NumberIdentifier');
        }

        if (typeof value !== 'number') {
            throw this.createValidationError('NumberIdentifier must be a number', 'NumberIdentifier');
        }
    }

    public static isValid(value: number): boolean {
        return typeof value === 'number';
    }

    public toValue(): number {
        return this.value;
    }

}

export class NanoIDIdentifier extends BaseValueObject<string> {
    constructor(value: string) {
        super(value);
    }

    public static create(value: string): NanoIDIdentifier {
        return new NanoIDIdentifier(value);
    }

    protected validate(value: string): void {
        if (!value) {
            throw this.createValidationError('NanoIDIdentifier cannot be empty', 'NanoIDIdentifier');
        }

        if (typeof value !== 'string') {
            throw this.createValidationError('NanoIDIdentifier must be a string', 'NanoIDIdentifier');
        }
    }

    public static isValid(value: string): boolean {
        return typeof value === 'string';
    }

    public toValue(): string {
        return this.value;
    }

    public static generate(): NanoIDIdentifier {
        return new NanoIDIdentifier(nanoid());
    }
}