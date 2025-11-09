import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { retry } from 'rxjs/operators';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class TracklistService {
  constructor(private readonly httpService: HttpService) {}

  async addTrackList(mbid: string): Promise<string[] | null> {
    if (!mbid) {
      return null;
    }
    const tracklist = await this.getTracklist(mbid);
    return tracklist;
  }

  async updateTrackList(
    newMbid: string,
    existingMbid?: string,
  ): Promise<string[] | null> {
    if (newMbid && newMbid !== existingMbid) {
      return this.getTracklist(newMbid);
    }
    return null;
  }

  private async getTracklist(mbid: string): Promise<string[] | null> {
    const url = `https://beta.musicbrainz.org/ws/2/release/${mbid}?inc=recordings&fmt=xml`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url).pipe(retry(3)),
      );
      const xml = response.data;
      const parsed = await parseStringPromise(xml);

      const release = parsed.metadata?.release?.[0];
      const mediumList = release?.['medium-list']?.[0];
      const medium = mediumList?.medium?.[0];
      const trackList = medium?.['track-list']?.[0];
      const tracks = trackList?.track;

      if (!tracks) {
        return null;
      }
      return tracks.map((track) => track.recording[0].title[0]);
    } catch (error) {
      const cause = {
        status: error.response?.status || 'Unknown',
        data: error.response?.data || 'No response data',
        mbid,
      };
      console.error('API error:', cause);
      return null;
    }
  }
}
