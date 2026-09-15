import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

export interface HealthResponse {
  readonly status: 'ok';
  readonly service: '@connuoc/api';
}

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Liveness check' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['status', 'service'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        service: { type: 'string', enum: ['@connuoc/api'] },
      },
    },
  })
  health(): HealthResponse {
    return { status: 'ok', service: '@connuoc/api' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for currently enabled modules' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['status', 'service'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        service: { type: 'string', enum: ['@connuoc/api'] },
      },
    },
  })
  ready(): HealthResponse {
    return { status: 'ok', service: '@connuoc/api' };
  }
}
