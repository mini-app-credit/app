import { EventPublisher } from "../../application/services";
import { DomainEvent } from "../../domain";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";
import { Logger } from "@nestjs/common";
import { getCorrelationId } from "../correlation";

export class NatsPublisherService implements EventPublisher {
    private readonly logger = new Logger(NatsPublisherService.name);

    constructor(private readonly client: ClientProxy) { }

    publishMany<T extends DomainEvent>(events: T[]): Promise<string[]> {
        return Promise.all(events.map(event => this.publish(event)));
    }

    async publish(event: DomainEvent): Promise<string> {
        try {
            const correlationId = getCorrelationId();
            const payload = { ...event.toObject(), correlationId };

            this.logger.debug({ eventName: event.eventName, eventId: event.eventId, aggregateId: event.aggregateId, correlationId }, 'Publishing event');

            const result = await firstValueFrom(
                this.client.emit(event.eventName, payload)
            );

            this.logger.debug({ eventName: event.eventName, eventId: event.eventId, result }, 'Event published');

            return event.eventId;
        } catch (error) {
            this.logger.error({ eventName: event.eventName, eventId: event.eventId, err: error.message }, 'Failed to publish event');
            throw error;
        }
    }
}