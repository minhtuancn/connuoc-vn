import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Put,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { CurrentAdminActor, RequireAdminCapabilities } from './admin.decorators.js';
import { AdminAuthGuard, AdminCapabilityGuard } from './admin.guards.js';
import {
  AdminDataError,
  PgAdminRepository,
  type AdminMutationContext,
} from './admin.repository.js';
import type { AdminActor } from './admin.types.js';
import {
  ProviderConfigPolicyError,
  ProviderConfigService,
} from './provider-config.service.js';
import {
  ProviderConfigWriteSchema,
  ProviderStatusPatchSchema,
} from './provider-config.types.js';

const IdentifierSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, 'invalid identifier');
const UuidSchema = z.string().uuid();
const MetadataSchema = z.record(z.string(), z.unknown());
const CorrelationIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/);

const SourcePatchSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    isActive: z.boolean().optional(),
    metadata: MetadataSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'at least one source field is required');

const TimeZoneSchema = z.string().min(1).max(64).refine((value) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}, 'expected a valid IANA timezone');

const StationPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    timeZone: TimeZoneSchema.optional(),
    defaultDatumId: z.string().trim().min(1).max(160).optional(),
    metadata: MetadataSchema.optional(),
    latitude: z.number().finite().min(-90).max(90).optional(),
    longitude: z.number().finite().min(-180).max(180).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0) {
      context.addIssue({ code: 'custom', message: 'at least one station field is required' });
    }
    if ((value.latitude === undefined) !== (value.longitude === undefined)) {
      context.addIssue({
        code: 'custom',
        path: ['latitude'],
        message: 'latitude and longitude must be supplied together',
      });
    }
  });

const ImportPatchSchema = z
  .object({ metadata: MetadataSchema.refine((value) => Object.keys(value).length > 0, 'metadata must not be empty') })
  .strict();

function parseOrBadRequest<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException(
      result.error.issues.map((issue) => `${issue.path.join('.') || 'request'}: ${issue.message}`).join('; '),
    );
  }
  return result.data;
}

function mapAdminDataError(error: unknown): never {
  if (!(error instanceof AdminDataError)) throw error;
  if (error.code === 'NOT_FOUND') throw new NotFoundException(error.message);
  throw new ServiceUnavailableException(error.message);
}

function mapProviderConfigError(error: unknown): never {
  if (error instanceof ProviderConfigPolicyError) {
    throw new BadRequestException(`${error.code}: ${error.message}`);
  }
  return mapAdminDataError(error);
}

function correlationId(request: FastifyRequest, reply: FastifyReply): string {
  const candidate = request.headers['x-request-id'];
  const value = typeof candidate === 'string' ? parseOrBadRequest(CorrelationIdSchema, candidate) : randomUUID();
  reply.header('x-request-id', value);
  return value;
}

function mutationContext(
  actor: AdminActor,
  request: FastifyRequest,
  reply: FastifyReply,
): AdminMutationContext {
  return {
    actor,
    correlationId: correlationId(request, reply),
    requestMethod: request.method,
    requestPath: request.url,
  };
}

@ApiTags('admin')
@ApiBearerAuth('admin-bearer')
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminCapabilityGuard)
export class AdminController {
  constructor(
    @Inject(PgAdminRepository) private readonly repository: PgAdminRepository,
    @Inject(ProviderConfigService) private readonly providerConfigs: ProviderConfigService,
  ) {}

  @Get('sources')
  @RequireAdminCapabilities('admin:read')
  @ApiOperation({ summary: 'List configured data sources' })
  @ApiOkResponse({ schema: { type: 'object', additionalProperties: true } })
  async listSources() {
    try {
      return { items: await this.repository.listSources() };
    } catch (error) {
      mapAdminDataError(error);
    }
  }

  @Get('providers')
  @RequireAdminCapabilities('admin:read')
  @ApiOperation({ summary: 'List secret-safe provider configuration metadata' })
  async listProviders() {
    try {
      return { items: await this.providerConfigs.list() };
    } catch (error) {
      mapProviderConfigError(error);
    }
  }

  @Get('providers/:providerKey')
  @RequireAdminCapabilities('admin:read')
  @ApiParam({ name: 'providerKey', type: String })
  @ApiOperation({ summary: 'Read one secret-safe provider configuration' })
  async getProvider(@Param('providerKey') providerKeyRaw: string) {
    const providerKey = parseOrBadRequest(IdentifierSchema, providerKeyRaw);
    try {
      const provider = await this.providerConfigs.get(providerKey);
      if (!provider) throw new NotFoundException(`Provider '${providerKey}' was not found.`);
      return provider;
    } catch (error) {
      mapProviderConfigError(error);
    }
  }

  @Put('providers/:providerKey')
  @RequireAdminCapabilities('providers:write')
  @ApiParam({ name: 'providerKey', type: String })
  @ApiOperation({ summary: 'Create or replace provider configuration and append a safe audit record' })
  @ApiBody({ schema: { type: 'object', additionalProperties: false } })
  async putProvider(
    @Param('providerKey') providerKeyRaw: string,
    @Body() body: unknown,
    @CurrentAdminActor() actor: AdminActor,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const providerKey = parseOrBadRequest(IdentifierSchema, providerKeyRaw);
    const input = parseOrBadRequest(ProviderConfigWriteSchema, body);
    try {
      return await this.providerConfigs.put(providerKey, input, mutationContext(actor, request, reply));
    } catch (error) {
      mapProviderConfigError(error);
    }
  }

  @Patch('providers/:providerKey/status')
  @RequireAdminCapabilities('providers:write')
  @ApiParam({ name: 'providerKey', type: String })
  @ApiOperation({ summary: 'Change provider operational status and append a safe audit record' })
  async patchProviderStatus(
    @Param('providerKey') providerKeyRaw: string,
    @Body() body: unknown,
    @CurrentAdminActor() actor: AdminActor,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const providerKey = parseOrBadRequest(IdentifierSchema, providerKeyRaw);
    const patch = parseOrBadRequest(ProviderStatusPatchSchema, body);
    try {
      return await this.providerConfigs.patchStatus(
        providerKey,
        patch,
        mutationContext(actor, request, reply),
      );
    } catch (error) {
      mapProviderConfigError(error);
    }
  }

  @Get('stations/:id')
  @RequireAdminCapabilities('admin:read')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Read an administrative station view' })
  async getStation(@Param('id') id: string) {
    const stationId = parseOrBadRequest(IdentifierSchema, id);
    try {
      const station = await this.repository.getStation(stationId);
      if (!station) throw new NotFoundException(`Station '${stationId}' was not found.`);
      return station;
    } catch (error) {
      mapAdminDataError(error);
    }
  }

  @Get('imports/:id')
  @RequireAdminCapabilities('admin:read')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Read an import run with provenance metadata' })
  async getImport(@Param('id') id: string) {
    const importRunId = parseOrBadRequest(UuidSchema, id);
    try {
      const run = await this.repository.getImport(importRunId);
      if (!run) throw new NotFoundException(`Import run '${importRunId}' was not found.`);
      return run;
    } catch (error) {
      mapAdminDataError(error);
    }
  }

  @Patch('sources/:sourceKey')
  @RequireAdminCapabilities('sources:write')
  @ApiParam({ name: 'sourceKey', type: String })
  @ApiOperation({ summary: 'Update a data source and append an audit record' })
  @ApiBody({ schema: { type: 'object', additionalProperties: false } })
  async patchSource(
    @Param('sourceKey') sourceKeyRaw: string,
    @Body() body: unknown,
    @CurrentAdminActor() actor: AdminActor,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const sourceKey = parseOrBadRequest(IdentifierSchema, sourceKeyRaw);
    const patch = parseOrBadRequest(SourcePatchSchema, body);
    try {
      return await this.repository.updateSource(sourceKey, patch, mutationContext(actor, request, reply));
    } catch (error) {
      mapAdminDataError(error);
    }
  }

  @Patch('stations/:id')
  @RequireAdminCapabilities('stations:write')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Update a station and append an audit record' })
  async patchStation(
    @Param('id') idRaw: string,
    @Body() body: unknown,
    @CurrentAdminActor() actor: AdminActor,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const stationId = parseOrBadRequest(IdentifierSchema, idRaw);
    const patch = parseOrBadRequest(StationPatchSchema, body);
    try {
      return await this.repository.updateStation(stationId, patch, mutationContext(actor, request, reply));
    } catch (error) {
      mapAdminDataError(error);
    }
  }

  @Patch('imports/:id')
  @RequireAdminCapabilities('imports:annotate')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Merge diagnostic metadata onto an import run and append an audit record' })
  async patchImport(
    @Param('id') idRaw: string,
    @Body() body: unknown,
    @CurrentAdminActor() actor: AdminActor,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const importRunId = parseOrBadRequest(UuidSchema, idRaw);
    const patch = parseOrBadRequest(ImportPatchSchema, body);
    try {
      return await this.repository.annotateImport(importRunId, patch, mutationContext(actor, request, reply));
    } catch (error) {
      mapAdminDataError(error);
    }
  }
}
