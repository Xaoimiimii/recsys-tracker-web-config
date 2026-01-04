import { Module } from '@nestjs/common';
import { WidgetDesignService } from './widget-design.service';
import { WidgetDesignController } from './widget-design.controller';

@Module({
  providers: [WidgetDesignService],
  controllers: [WidgetDesignController]
})
export class WidgetDesignModule {}
