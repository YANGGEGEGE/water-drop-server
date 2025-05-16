import { Injectable } from '@nestjs/common';
import * as Dysmsapi from '@alicloud/dysmsapi20170525';
import Util, * as utils from '@alicloud/tea-util';
import { getRandomCode } from '@/shared/utils';
import { SIGN_NAME, TEMPLATE_CODE } from '@/common/constants/aliyun';
import { UserService } from './../user/user.service';
import { msgClient } from '@/shared/utils/msg';
import * as dayjs from 'dayjs';
import { Result } from '@/common/dto/result.type';
import {
  CODE_NOT_EXPIRE,
  CODE_SEND_ERROR,
  SUCCESS,
  UPDATE_ERROR,
} from '@/common/constants/code';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  // 发送短信验证码
  async sendCodeMsg(tel: string): Promise<Result> {
    const user = await this.userService.findByTel(tel);
    console.log('user11111', user);
    if (user) {
      const diffTime = dayjs().diff(dayjs(user.codeCreateTimeAt));
      console.log('🚀 ~ AuthService ~ sendCodeMsg ~ diffTime:', diffTime);
      if (diffTime < 60 * 1000) {
        return {
          code: CODE_NOT_EXPIRE,
          message: 'code 尚未过期',
        };
      }
    }
    const code = getRandomCode();
    const sendSmsRequest = new Dysmsapi.SendSmsRequest({
      signName: SIGN_NAME,
      templateCode: TEMPLATE_CODE,
      phoneNumbers: tel,
      templateParam: `{\"code\":\"${code}\"}`,
    });
    const runtime = new utils.RuntimeOptions({});
    try {
      const sendRes = await msgClient.sendSmsWithOptions(
        sendSmsRequest,
        runtime,
      );
      if (sendRes.body.code !== 'OK') {
        return {
          code: CODE_SEND_ERROR,
          message: sendRes.body.message || '短信发送失败，请稍后再试',
        };
      }
      if (user) {
        const result = await this.userService.updateCode(user.id, code);
        if (result) {
          return {
            code: SUCCESS,
            message: '获取验证码成功',
          };
        }
        return {
          code: UPDATE_ERROR,
          message: '更新验证码失败',
        };
      }
      const result = await this.userService.create({
        tel,
        code,
        codeCreateTimeAt: new Date(),
      });
      if (result) {
        return {
          code: SUCCESS,
          message: '获取验证码成功（新用户）',
        };
      }
      return {
        code: UPDATE_ERROR,
        message: '创建用户或保存验证码失败',
      };
    } catch (error) {
      console.error('Error in sendCodeMsg:', error);
      return {
        code: CODE_SEND_ERROR,
        message: error.message || '发送验证码时发生内部错误，请稍后再试',
      };
    }
  }
}
