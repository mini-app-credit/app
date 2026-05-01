export type ApplicationToken = {
    id: string;
    token: string;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
}