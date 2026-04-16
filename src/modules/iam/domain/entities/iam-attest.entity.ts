import { Attest, AttestProps } from "src/shared";

export interface IAMAttestPayload extends Record<string, unknown> {
  userId: string;
  accountId: string;
}

export interface IAMAttestProps extends AttestProps {
  payload: IAMAttestPayload
}

export class IAMAttest extends Attest {
  constructor(props: AttestProps) {
    super(props);
  }

  get userId(): string {
    return this.props.payload.userId as string;
  }

  get accountId(): string {
    return this.props.payload.accountId as string;
  }

  static restore(props: AttestProps): IAMAttest {
    return new IAMAttest(props);
  }
}