import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class SubscribeDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class SendNewsletterDto {
  @IsString()
  subject: string;

  @IsString()
  htmlContent: string;

  @IsBoolean()
  sendImmediately: boolean = false;
}
