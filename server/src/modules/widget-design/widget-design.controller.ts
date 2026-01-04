import { Controller, Post } from '@nestjs/common';
import { WidgetDesignService } from './widget-design.service';

@Controller('widget-design')
export class WidgetDesignController {
    constructor(private readonly widgetDesignService: WidgetDesignService) { }
    
    @Post()
    createWidgetDesign() {
        // Implementation for creating a widget design
    }
}
