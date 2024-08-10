import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, FindOptionsWhere } from 'typeorm';
import { Temp } from './models/temp.entity';
@Injectable()
export class TempService {
  constructor(
    @InjectRepository(Temp)
    private readonly tempRepository: Repository<Temp>,
  ) {}

  async create(entity: DeepPartial<Temp>): Promise<boolean> {
    const res = await this.tempRepository.save(
      this.tempRepository.create(entity),
    );
    if (res) {
      return true;
    }
    return false;
  }

  async findById(id: string): Promise<Temp> {
    return this.tempRepository.findOne({
      where: {
        id,
      },
    });
  }

  async updateById(id: string, entity: DeepPartial<Temp>): Promise<boolean> {
    const existEntity = await this.findById(id);
    if (!existEntity) {
      return false;
    }
    Object.assign(existEntity, entity);
    const res = await this.tempRepository.save(existEntity);
    if (res) {
      return true;
    }
    return false;
  }

  async findTemps({
    start,
    length,
    where,
  }: {
    start: number;
    length: number;
    where: FindOptionsWhere<Temp>;
  }): Promise<[Temp[], number]> {
    return this.tempRepository.findAndCount({
      take: length,
      skip: start,
      where,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const res1 = await this.tempRepository.update(id, {
      deletedBy: userId,
    });
    if (res1) {
      const res = await this.tempRepository.softDelete(id);
      if (res.affected > 0) {
        return true;
      }
    }
    return false;
  }
}
