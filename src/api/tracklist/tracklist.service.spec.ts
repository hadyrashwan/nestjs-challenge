import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { TracklistService } from './tracklist.service';

describe('TracklistService', () => {
  let tracklistService: TracklistService;
  let httpService: HttpService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TracklistService,
        {
          provide: HttpService,
          useFactory: () => ({
            get: jest.fn(),
          }),
        },
      ],
    }).compile();

    tracklistService = module.get<TracklistService>(TracklistService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('addTrackList', () => {
    it('should return a tracklist from MusicBrainz', async () => {
      const mbid = 'some-mbid';
      const musicBrainzResponse = `
        <metadata>
          <release>
            <medium-list>
              <medium>
                <track-list>
                  <track>
                    <recording>
                      <title>Track 1</title>
                    </recording>
                  </track>
                  <track>
                    <recording>
                      <title>Track 2</title>
                    </recording>
                  </track>
                </track-list>
              </medium>
            </medium-list>
          </release>
        </metadata>
      `;

      const axiosResponse = {
        data: musicBrainzResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponse));

      const result = await tracklistService.addTrackList(mbid);

      expect(httpService.get).toHaveBeenCalledWith(
        `https://beta.musicbrainz.org/ws/2/release/${mbid}?inc=recordings&fmt=xml`,
      );
      expect(result).toEqual(['Track 1', 'Track 2']);
    });

    it('should return null if the MusicBrainz call fails', async () => {
      const mbid = 'some-mbid';

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('MusicBrainz API Error')));

      const result = await tracklistService.addTrackList(mbid);

      expect(result).toBeNull();
    });

    it('should return null if no mbid is provided', async () => {
      const result = await tracklistService.addTrackList(undefined);
      expect(result).toBeNull();
    });
  });

  describe('updateTrackList', () => {
    it('should return a tracklist if the mbid has changed', async () => {
      const newMbid = 'new-mbid';
      const oldMbid = 'old-mbid';
      const musicBrainzResponse = `
        <metadata>
          <release>
            <medium-list>
              <medium>
                <track-list>
                  <track>
                    <recording>
                      <title>Track 1</title>
                    </recording>
                  </track>
                </track-list>
              </medium>
            </medium-list>
          </release>
        </metadata>
      `;

      const axiosResponse = {
        data: musicBrainzResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponse));

      const result = await tracklistService.updateTrackList(newMbid, oldMbid);

      expect(httpService.get).toHaveBeenCalledWith(
        `https://beta.musicbrainz.org/ws/2/release/${newMbid}?inc=recordings&fmt=xml`,
      );
      expect(result).toEqual(['Track 1']);
    });

    it('should return null if the mbid has not changed', async () => {
      const mbid = 'some-mbid';
      const result = await tracklistService.updateTrackList(mbid, mbid);
      expect(result).toBeNull();
    });

    it('should return null if no new mbid is provided', async () => {
      const result = await tracklistService.updateTrackList(
        undefined,
        'some-mbid',
      );
      expect(result).toBeNull();
    });
  });

  describe('getTracklist (private method)', () => {
    it('should return a tracklist from MusicBrainz', async () => {
      const mbid = 'some-mbid';
      const musicBrainzResponse = `
        <metadata>
          <release>
            <medium-list>
              <medium>
                <track-list>
                  <track>
                    <recording>
                      <title>Track 1</title>
                    </recording>
                  </track>
                  <track>
                    <recording>
                      <title>Track 2</title>
                    </recording>
                  </track>
                </track-list>
              </medium>
            </medium-list>
          </release>
        </metadata>
      `;

      const axiosResponse = {
        data: musicBrainzResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponse));

      // Accessing private method using bracket notation
      const result = await (tracklistService as any)['getTracklist'](mbid);

      expect(httpService.get).toHaveBeenCalledWith(
        `https://beta.musicbrainz.org/ws/2/release/${mbid}?inc=recordings&fmt=xml`,
      );
      expect(result).toEqual(['Track 1', 'Track 2']);
    });

    it('should return null if the MusicBrainz call fails', async () => {
      const mbid = 'some-mbid';

      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('MusicBrainz API Error')));

      // Accessing private method using bracket notation
      const result = await (tracklistService as any)['getTracklist'](mbid);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
