import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { InviteDto } from './dto/invite.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.projectsService.findAll(req.user.userId);
  }

  @Get(':id/members')
  ProjectMembers(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.ProjectMembers(+id, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findOne(+id, req.user.userId);
  }

  @Post(':id/invite')
  invite(@Param('id') id: string, @Body() dto: InviteDto, @Req() req: any) {
    return this.projectsService.invite(+id, dto.email, req.user.userId);
  }
}
