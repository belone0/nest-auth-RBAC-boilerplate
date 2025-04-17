import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import { Tokens } from 'src/auth/types';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/common/enums';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService
  ) { }

  async me(user_id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: user_id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        cpf_cnpj: true,
        created_at: true,
        updated_at: true
      },

    });

    if (!user) { throw new NotFoundException(); }

    return user;
  }

  async create(createUserDto: CreateUserDto) {

    if (!Object.values(Role).includes(createUserDto.role as Role)) { throw new BadRequestException('Invalid role'); }

    const hash = await bcrypt.hash(createUserDto.password, 10);

    const new_user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        role: createUserDto.role,
        hash
      }
    }).catch((error) => {
      if (error.code === 'P2002') {
        throw new BadRequestException('Email already in use');
      }
      throw error;
    });

    const tokens = await this.getTokens(new_user.id, new_user.email, new_user.role);
    await this.updateRtHash(new_user.id, tokens.refresh_token);

    return new_user;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        parent: { select: { id: true, email: true, name: true, role: true } },
        children: { select: { id: true, email: true, name: true, role: true } }
      }
    });

    return users;
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, email: true, name: true, role: true } },
        children: { select: { id: true, email: true, name: true, role: true } }
      }
    });

    if (!user) { throw new NotFoundException(); }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {

    if (!Object.values(Role).includes(updateUserDto.role as Role)) { throw new BadRequestException('Invalid role'); }

    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException();
    }

    if (user.email !== updateUserDto.email) {
      const existing_user = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email }
      });

      if (existing_user) { throw new BadRequestException('Email already in use'); }
    }

    const data: any = {
      name: updateUserDto.name,
      email: updateUserDto.email,
      role: updateUserDto.role,
    };

    if (updateUserDto.password) {
      data.hash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updated_user = await this.prisma.user.update({
      where: { id },
      data
    });


    return updated_user;
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) { throw new NotFoundException(); }

    return await this.prisma.user.delete({
      where: { id }
    });
  }

  async updateRtHash(user_id: number, rt: string): Promise<void> {
    const hash = await bcrypt.hash(rt, 10);

    await this.prisma.user.update({
      where: { id: user_id },
      data: { hashed_rt: hash }
    })
  }

  async getTokens(user_id: number, email: string, role: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user_id,
          id: user_id,
          email,
          role,
        },
        {
          secret: this.config.get('AT_SECRET') as string,
          expiresIn: 60 * 15
        }),
      this.jwtService.signAsync(
        {
          sub: user_id,
          id: user_id,
          email,
          role,
        },
        {
          secret: this.config.get('RT_SECRET') as string,
          expiresIn: 60 * 60 * 24 * 7
        })

    ]);

    return {
      access_token: at,
      refresh_token: rt
    };
  }
}
