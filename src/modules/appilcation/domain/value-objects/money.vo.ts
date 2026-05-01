import { BaseValueObject } from "src/shared";

export type MoneyProps = {
    amount: number;
    currency: string;
}

export class Money extends BaseValueObject<MoneyProps> {
    public static create(amount: number, currency = 'USD'): Money {
        return new Money({ amount, currency });
    }

    protected validate(value: MoneyProps): void {
        if (!Number.isInteger(value.amount)) {
            throw this.createValidationError
                ('Money must be an integer', 'Money');
        }

        if (value.amount < 0) {
            throw this.createValidationError
                ('Money must be greater than 0', 'Money');
        }

        if (!value.currency || value.currency.length !== 3) {
            throw this.createValidationError
                ('Currency must be a 3-letter ISO 4217 code', 'Money');
        }
    }

}