import { SetMetadata } from '@nestjs/common';

export const METHOD_LOG_METADATA: string = 'METHOD_LOG_METADATA';

export interface LogOptions {
  mask?: {
    request?: string[] | boolean;
    response?: string[] | boolean;
  };
}

export const Log = (options: LogOptions) => SetMetadata(METHOD_LOG_METADATA, options);
