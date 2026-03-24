/// Deep link service stub for WorkOn.
///
/// Placeholder — deep link attribution disabled in dev.
/// No external dependency required.
library;

/// Attribution data from deep links (UTM params, referral, etc.)
class Attribution {
  const Attribution({
    this.utmSource,
    this.utmMedium,
    this.utmCampaign,
    this.utmContent,
    this.referrer,
    this.referralCode,
  });

  final String? utmSource;
  final String? utmMedium;
  final String? utmCampaign;
  final String? utmContent;
  final String? referrer;
  final String? referralCode;

  /// Returns true if attribution has any data.
  bool get hasData =>
      utmSource != null || utmMedium != null ||
      utmCampaign != null || referrer != null ||
      referralCode != null;

  @override
  String toString() =>
      'Attribution(source: $utmSource, medium: $utmMedium, campaign: $utmCampaign)';
}

/// Stub service for deep link attribution.
/// Real implementation pending — disabled in local dev.
abstract final class DeepLinkService {
  /// Returns attribution data from the last deep link.
  /// Always returns null in this stub.
  static Future<Attribution?> getAttribution() async => null;

  /// Handles an incoming deep link URI.
  static Future<void> handleLink(Uri uri) async {}
}
