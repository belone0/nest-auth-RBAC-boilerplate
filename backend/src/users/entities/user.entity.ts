export class User {
    id: number;
    email: string;
    role: string;
    created_at: Date;
    updated_at: Date;
    hash: string;
    hashed_rt?: string;
    parent_id?: number;
}
