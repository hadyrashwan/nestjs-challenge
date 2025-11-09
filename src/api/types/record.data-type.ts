import { RecordFormat, RecordCategory } from '../schemas/record.enum';

/**
 * Represents the shape of data that can be persisted or updated
 * in the Record collection. This type is used internally by the
 * repository and service layers — not exposed to API clients.
 */
export type RecordData = {
  artist?: string;
  album?: string;
  price?: number;
  qty?: number;
  format?: RecordFormat;
  category?: RecordCategory;
  mbid?: string;
  /**
   * The list of track names fetched from MusicBrainz
   * or other sources. Not provided by client requests.
   */
  tracklist?: string[];
};
