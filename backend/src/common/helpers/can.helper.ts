import { Permissions } from "../rules/permission.rules";

export default function can(role: string, action: string) {
    const permissions = Permissions[role];
    return permissions.includes(action);
}