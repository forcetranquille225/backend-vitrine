import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto, ContactResponseDto } from './contact.dto';

@Controller('api/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async create(
    @Body() createContactDto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    return this.contactService.create(createContactDto);
  }

  @Get()
  async findAll(): Promise<ContactResponseDto[]> {
    return this.contactService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ContactResponseDto> {
    return this.contactService.findOne(id);
  }
}
