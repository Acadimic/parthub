import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ErrorResponse } from '@repo/shared/responses';
import { FastifyReply } from 'fastify';
import { Error as MongooseError } from 'mongoose';

/**
 * Turns a Mongoose cast error — an id that is not a valid ObjectId, such as a course slug sent
 * where an id belongs — into a 400 naming the bad value, instead of the default handler's 500.
 */
@Catch(MongooseError.CastError)
export class MongoCastFilter implements ExceptionFilter {
  catch(exception: MongooseError.CastError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const errorResponse: ErrorResponse = {
      error: {
        code: HttpStatus.BAD_REQUEST,
        message: `"${String(exception.value)}" is not a valid ${exception.kind === 'ObjectId' ? 'id' : exception.kind} for ${exception.path}.`,
      },
    };
    response.status(HttpStatus.BAD_REQUEST).send(errorResponse);
  }
}
