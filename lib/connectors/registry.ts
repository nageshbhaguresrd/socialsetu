import { PlatformId } from '@/lib/types/enterprise';
import { SocialConnector } from './base';
import { InstagramBusinessConnector } from './meta/instagramBusiness';
import { FacebookPageConnector } from './meta/facebookPage';
import { LinkedInPageConnector } from './linkedin/linkedinPage';
import { YouTubeChannelConnector } from './youtube/youtubeChannel';
import { TwitterV2Connector } from './twitter/twitterV2';

class ConnectorRegistry {
  private connectors: Map<PlatformId, SocialConnector> = new Map();

  constructor() {
    this.register(new InstagramBusinessConnector());
    this.register(new FacebookPageConnector());
    this.register(new LinkedInPageConnector());
    this.register(new YouTubeChannelConnector());
    this.register(new TwitterV2Connector());
  }

  public register(connector: SocialConnector): void {
    this.connectors.set(connector.platformId, connector);
  }

  public get(platformId: PlatformId): SocialConnector {
    const connector = this.connectors.get(platformId);
    if (!connector) {
      throw new Error(`Social connector for platform "${platformId}" is not registered.`);
    }
    return connector;
  }

  public has(platformId: PlatformId): boolean {
    return this.connectors.has(platformId);
  }

  public getAll(): SocialConnector[] {
    return Array.from(this.connectors.values());
  }

  public getSupportedPlatforms(): PlatformId[] {
    return Array.from(this.connectors.keys());
  }
}

export const connectorRegistry = new ConnectorRegistry();
