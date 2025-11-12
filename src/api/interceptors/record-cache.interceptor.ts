import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PaginatedRecordResponseDTO } from '../dtos/paginated-record.response.dto';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { RecordPaginationDTO } from '../dtos/record-pagination.dto';

function generateCacheKey(
  filter: RecordFilterDTO,
  pagination: RecordPaginationDTO,
) {
  const queryParams = { ...filter, ...pagination };
  const key = Object.keys(queryParams)
    .sort()
    .map((k) => `${k}=${queryParams[k]}`)
    .join('&');
  return `records:${key}`;
}

const TTL_IN_MS = 3000; // Default TTL of 3 seconds

@Injectable()
export class RecordCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const filter: RecordFilterDTO = request.query || {};
    const pagination: RecordPaginationDTO = request.query || {};

    // Skip cache if client sends "no-cache"
    const noCache =
      request.headers['cache-control']?.includes('no-cache') ||
      request.headers['pragma']?.includes('no-cache');

    if (pagination.cursor || noCache) {
      response.setHeader('Cache-Control', 'no-store'); // don't cache
      response.setHeader('X-Cache-Status', 'MISS');
      return next.handle();
    }

    const cacheKey = generateCacheKey(filter, pagination);

    return new Observable((observer) => {
      this.cacheManager
        .get<PaginatedRecordResponseDTO>(cacheKey)
        .then((cached) => {
          if (cached) {
            // Standard header to indicate this response came from cache
            response.setHeader('Cache-Control', `public, max-age=${TTL_IN_MS}`); // example: 5 minutes
            response.setHeader('X-Cache-Status', 'HIT');
            observer.next(cached);
            observer.complete();
          } else {
            next
              .handle()
              .pipe(
                tap((result) => {
                  this.cacheManager.set(cacheKey, result, TTL_IN_MS); // TTL in ms
                  response.setHeader(
                    'Cache-Control',
                    `public, max-age=${TTL_IN_MS}`,
                  );
                  response.setHeader(
                    'Cache-Control',
                    `public, max-age=${TTL_IN_MS}`,
                  );
                  response.setHeader('X-Cache-Status', 'MISS');
                }),
              )
              .subscribe({
                next: (val) => observer.next(val),
                error: (err) => observer.error(err),
                complete: () => observer.complete(),
              });
          }
        });
    });
  }
}
