import { Role } from "src/common/enums";


const admin_permissions = [
    'mock_permission:own',
    'mock_permission:any',

];
const user_permissions = [
    'mock_permission:own',
];

export const Permissions = {
    [Role.USER]: admin_permissions,
    [Role.ADMIN]: user_permissions,
};