import { UUIDIdentifier } from 'src/shared';
import { ApplicationAggregate } from '../aggregates/application.aggregate';
import { ApplicationStatus } from '../value-objects';

export interface ApplicationRepository {
  findById(id: UUIDIdentifier): Promise<ApplicationAggregate | null>;
  findByToken(token: string): Promise<ApplicationAggregate | null>;
  findAll(filters: {
    status?: ApplicationStatus;
    vendorId?: string;
  }): Promise<ApplicationAggregate[]>;
  save(aggregate: ApplicationAggregate): Promise<ApplicationAggregate>;
  delete(id: UUIDIdentifier): Promise<void>;
}
