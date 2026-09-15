import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

function exceptionDetail(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (typeof response === 'object' && response !== null && 'message' in response) {
    const message = response.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.filter((item): item is string => typeof item === 'string').join('; ');
    }
  }
  return exception.message;
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const reply = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const detail = exception instanceof HttpException
      ? exceptionDetail(exception)
      : 'An unexpected server error occurred.';

    reply.status(status).type('application/problem+json').send({
      type: 'about:blank',
      title: status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal Server Error' : 'Request Failed',
      status,
      detail,
      instance: request.url,
    });
  }
}
