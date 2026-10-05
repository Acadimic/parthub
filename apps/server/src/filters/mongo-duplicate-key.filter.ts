import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '@repo/shared/responses';
import { FastifyReply } from 'fastify';
import { mongo } from 'mongoose';

/** MongoDB's code for a write a unique index refused. */
export const DUPLICATE_KEY = 11000;

/**
 * Turns a MongoDB duplicate-key error into a 409 the apps can show.
 *
 * A unique index is the last line of defence for names, slugs and orders, and without this filter
 * a collision left Nest's default handler to answer a bare 500 "Internal server error" — the
 * support dashboard could not tell the user which value was taken. Any other server error still
 * falls through to the default handler.
 */
@Catch(mongo.MongoServerError)
export class MongoDuplicateKeyFilter implements ExceptionFilter {
  catch(exception: mongo.MongoServerError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    if (exception.code !== DUPLICATE_KEY) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        error: { code: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' },
      } satisfies ErrorResponse);
      return;
    }
    const fields = Object.entries((exception.keyValue as Record<string, unknown> | undefined) ?? {})
      .map(([field, value]) => `${field} "${String(value)}"`)
      .join(', ');
    const errorResponse: ErrorResponse = {
      error: {
        code: HttpStatus.CONFLICT,
        message: fields ? `A row with ${fields} already exists.` : 'A row with the same unique value already exists.',
      },
    };
    response.status(HttpStatus.CONFLICT).send(errorResponse);
  }
}
