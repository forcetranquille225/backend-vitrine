export class CreateContactDto {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  createdAt?: Date;
}

export class ContactResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  createdAt: Date;
}
