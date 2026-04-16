import { BaseValueObject } from "src/shared";
import { Email } from "./email.vo";

export type SubjectPrimitive = string;

export class AccountSubject extends BaseValueObject<SubjectPrimitive> {
  private constructor(value: SubjectPrimitive) {
    super(value);
  }

  protected validate(value: SubjectPrimitive): void {
    if (!value) {
      throw new Error('Account subject cannot be empty');
    }
  }

  static create(subject: SubjectPrimitive): AccountSubject {
    return new AccountSubject(subject.trim());
  }

  static fromEmail(email: SubjectPrimitive): AccountSubject {
    const emailVO = Email.create(email);

    return AccountSubject.create(emailVO.asString);
  }

  static fromOAuthId(providerId: SubjectPrimitive): AccountSubject {
    return AccountSubject.create(providerId);
  }

  get asString(): SubjectPrimitive {
    return this.value;
  }

  equals(other: AccountSubject): boolean {
    return this.asString === other.asString;
  }

  toString(): SubjectPrimitive {
    return this.value;
  }
}
