import { BaseValueObject } from "src/shared";

export interface TradeReferenceProps {
    businessName: string;
    engagementStart: Date | null;
    engagementEnd: Date | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPosition: string | null;
}


export class TradeReference extends BaseValueObject<TradeReferenceProps> {
    public static create(input:
        {
            businessName: string,
            engagementStart: Date | null,
            engagementEnd: Date | null,
            contactName: string | null,
            contactEmail: string | null,
            contactPosition: string | null,
        }): TradeReference {
        return new TradeReference({
            businessName: input.businessName,
            engagementStart: input.engagementStart,
            engagementEnd: input.engagementEnd,
            contactName: input.contactName,
            contactEmail: input.contactEmail,
            contactPosition: input.contactPosition,
        });
    }

    public getProps(): TradeReferenceProps {
        return this.value;
    }

    protected validate(value: TradeReferenceProps): void {
        if (!value.businessName) {
            throw this.createValidationError('Business name is required', 'businessName');
        }
        if (value.engagementStart && value.engagementEnd && value.engagementStart > value.engagementEnd) {
            throw this.createValidationError('Engagement start date must be before engagement end date', 'engagementStart');
        }

    }

    private static toDate(v: string | Date | null): Date | null {
        if (!v) {
            return null;
        }
        return v instanceof Date ? v : new Date(v);
    }
}

