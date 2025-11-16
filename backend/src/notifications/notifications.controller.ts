import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const userId = req.user.sub;
    const onlyUnread = unreadOnly === 'true';
    return this.notificationsService.getNotifications(userId, onlyUnread);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.sub;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    try {
      await this.notificationsService.markAsRead(id, userId);
      return { success: true };
    } catch (error) {
      throw new NotFoundException('Notification not found or access denied');
    }
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.sub;
    const count = await this.notificationsService.markAllAsRead(userId);
    return { count };
  }
}

