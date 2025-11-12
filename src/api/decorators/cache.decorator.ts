import { PaginatedRecordResponseDTO } from '../dtos/paginated-record.response.dto';
import { RecordFilterDTO } from '../dtos/record-filter.dto';
import { RecordPaginationDTO } from '../dtos/record-pagination.dto';
import { Cache as CacheManager } from 'cache-manager';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxAge?: number; // Max age in seconds for HTTP headers
}

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
// Cache requests without cursor.
// In a real-world scenario, consider adding cache invalidation strategies.
export function RecordCache(options: CacheOptions = { ttl: 3000 }) {
  return function (_: any, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      ...args: [RecordFilterDTO, RecordPaginationDTO]
    ) {
      const controller = this as { cacheManager?: CacheManager };
      if (!controller.cacheManager) {
        return originalMethod.apply(this, args);
      }

      const filter: RecordFilterDTO = args[0] || {};
      const pagination: RecordPaginationDTO = args[1] || {};

      if (pagination.cursor) {
        return originalMethod.apply(this, args);
      }

      const cacheKey = generateCacheKey(filter, pagination);
      const cachedValue =
        await controller.cacheManager.get<PaginatedRecordResponseDTO>(cacheKey);
      if (cachedValue) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return cachedValue;
      }

      const result: PaginatedRecordResponseDTO = await originalMethod.apply(
        this,
        args,
      );
      await controller.cacheManager.set<PaginatedRecordResponseDTO>(
        cacheKey,
        result,
        options.ttl,
      );

      return result;
    };

    return descriptor;
  };
}
