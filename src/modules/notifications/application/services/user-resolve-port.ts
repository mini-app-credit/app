export interface UserResolverPort {
    getEmail(userId: string): Promise<string | null>;
}