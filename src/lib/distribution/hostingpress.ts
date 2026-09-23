export interface HostingPressFeedConfig {
  enabled: boolean;
  feedUrl: string;
  token: string;
  sourceCredit: string;
}

/**
 * HostingPRESS uses tokenized RSS feeds for affiliate distribution.
 * This module intentionally does not invent or call an outbound publishing API.
 * It only builds the feed configuration and validates imported source credit.
 */
export function createHostingPressConfig(input: Partial<HostingPressFeedConfig> = {}): HostingPressFeedConfig {
  return {
    enabled: Boolean(input.enabled),
    feedUrl: input.feedUrl?.trim() ?? "",
    token: input.token?.trim() ?? "",
    sourceCredit: input.sourceCredit?.trim() || "PCH News",
  };
}

export function isHostingPressReady(config: HostingPressFeedConfig) {
  return config.enabled && Boolean(config.feedUrl) && Boolean(config.token) && Boolean(config.sourceCredit);
}

export function buildTokenizedFeedUrl(config: HostingPressFeedConfig) {
  if (!config.feedUrl) return "";
  const separator = config.feedUrl.includes("?") ? "&" : "?";
  return config.token ? `${config.feedUrl}${separator}token=${encodeURIComponent(config.token)}` : config.feedUrl;
}

export function sourceCreditForImportedArticle(sourceCredit: string) {
  const credit = sourceCredit.trim();
  return credit || "PCH News";
}
