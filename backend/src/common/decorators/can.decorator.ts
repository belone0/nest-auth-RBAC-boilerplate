import { SetMetadata } from '@nestjs/common';
// import { Role, Action } from 'src/common/enums';

export const Can = (args: string[]) => SetMetadata('action', args);
