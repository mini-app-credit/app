import { UUIDIdentifier } from "../value-objects";
import { BaseEntity, EntityProps } from "./base.entity";

export interface AttestProps extends EntityProps {
  id: UUIDIdentifier;
  value: string;
  expiresAt: Date;
  payload: Record<string, unknown>;
}

export type AttestCreateProps = Omit<AttestProps, 'id' | 'createdAt' | 'updatedAt'>;

export class Attest extends BaseEntity<AttestProps> {
  protected validate(): void {
    if (!UUIDIdentifier.isValid(this.props.id.toString())) {
      throw new Error("Invalid UUID");
    }
    if (!this.props.value) {
      throw new Error("Value is required");
    }
    if (!this.props.expiresAt) {
      throw new Error("Expires at is required");
    }
  }

  constructor(props: AttestProps) {
    super(props);
  }

  get id(): UUIDIdentifier {
    return this.props.id;
  }

  get value(): string {
    return this.props.value;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get payload(): Record<string, unknown> {
    return this.props.payload;
  }

  static create(props: AttestCreateProps): Attest {
    const now = new Date();

    return new Attest({
      id: UUIDIdentifier.generate(),
      value: props.value,
      expiresAt: props.expiresAt,
      payload: props.payload,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: AttestProps): Attest {
    return new Attest(props);
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }
}