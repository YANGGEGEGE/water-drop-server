import { FindOptionsWhere, Like } from 'typeorm';
import { Temp } from './models/temp.entity';
import {
  COURSE_CREATE_FAIL,
  COURSE_DEL_FAIL,
  COURSE_NOT_EXIST,
  COURSE_UPDATE_FAIL,
} from './../../common/constants/code';
import { Result } from '@/common/dto/result.type';
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '@/common/guards/auth.guard';
import { SUCCESS, STUDENT_NOT_EXIST } from '@/common/constants/code';
import { T'empResult, TempResults } from './dto/result-temp.output';
import { TempInput } from './dto/temp.input';
import { TempType } from './dto/temp.type';
import { TempService } from './temp.service';
import { CurUserId } from '@/common/decorators/current-user.decorator';
import { PageInput } from '@/common/dto/page.input';

@Resolver(() => TempType)
@UseGuards(GqlAuthGuard)
export class TempResolver {
  constructor(private readonly tempService: TempService) {}

  @Query(() => TempResult)
  async getTempInfo(@Args('id') id: string): Promise<TempResult> {
    const result = await this.tempService.findById(id);
    if (result) {
      return {
        code: SUCCESS,
        data: result,
        message: '获取成功',
      };
    }
    return {
      code: COURSE_NOT_EXIST,
      message: '课程信息不存在',
    };
  }

  @Mutation(() => TempResult)
  async commitTempInfo(
    @Args('params') params: TempInput,
    @CurUserId() userId: string,
    @Args('id', { nullable: true }) id: string,
  ): Promise<Result> {
    if (!id) {
      const res = await this.tempService.create({
        ...params,
        createdBy: userId,
      });
      if (res) {
        return {
          code: SUCCESS,
          message: '创建成功',
        };
      }
      return {
        code: COURSE_CREATE_FAIL,
        message: '创建失败',
      };
    }
    const temp = await this.tempService.findById(userId);
    if (temp) {
      const res = await this.tempService.updateById(temp.id, {
        ...params,
        updatedBy: userId,
      });
      if (res) {
        return {
          code: SUCCESS,
          message: '更新成功',
        };
      }
      return {
        code: COURSE_UPDATE_FAIL,
        message: '更新失败',
      };
    }
    return {
      code: COURSE_NOT_EXIST,
      message: '课程信息不存在',
    };
  }

  @Query(() => TempResults)
  async getTemps(
    @Args('page') page: PageInput,
    @CurUserId() userId: string,
    @Args('name', { nullable: true }) name?: string,
  ): Promise<TempResults> {
    const { pageNum, pageSize } = page;
    const where: FindOptionsWhere<Temp> = { createdBy: userId };
    if (name) {
      where.name = Like(`%${name}%`);
    }
    const [results, total] = await this.tempService.findTemps({
      start: pageNum === 1 ? 0 : (pageNum - 1) * pageSize + 1,
      length: pageSize,
      where,
    });
    return {
      code: SUCCESS,
      data: results,
      page: {
        pageNum,
        pageSize,
        total,
      },
      message: '获取成功',
    };
  }

  @Mutation(() => Result)
  async deleteTemp(
    @Args('id') id: string,
    @CurUserId() userId: string,
  ): Promise<Result> {
    const result = await this.tempService.findById(id);
    if (result) {
      const delRes = await this.tempService.deleteById(id, userId);
      if (delRes) {
        return {
          code: SUCCESS,
          message: '删除成功',
        };
      }
      return {
        code: COURSE_DEL_FAIL,
        message: '删除失败',
      };
    }
    return {
      code: COURSE_NOT_EXIST,
      message: '门店信息不存在',
    };
  }
}
