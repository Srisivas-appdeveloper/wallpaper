import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AdPlacement { afterApply, afterDownload }

/// Integration point for google_mobile_ads. Swap [NoopAdsService] for an AdMob-backed
/// implementation once the AdMob app ID is configured. Rewarded ads must be verified server-side.
abstract interface class AdsService {
  Future<void> onFlowCompleted(AdPlacement placement);
}

/// Conservative interstitial policy (Play "disruptive ads" friendly, spec §43-44):
/// never at launch, never back-to-back, only after several completed flows.
class InterstitialPolicy {
  InterstitialPolicy({
    this.minFlowsBetween = 4,
    this.minInterval = const Duration(minutes: 3),
  });

  final int minFlowsBetween;
  final Duration minInterval;
  int _flows = 0;
  DateTime? _lastShown;

  bool shouldShow(DateTime now) {
    _flows++;
    final spacedOut =
        _lastShown == null || now.difference(_lastShown!) >= minInterval;
    if (_flows < minFlowsBetween || !spacedOut) return false;
    _flows = 0;
    _lastShown = now;
    return true;
  }
}

class NoopAdsService implements AdsService {
  NoopAdsService(this._policy);

  final InterstitialPolicy _policy;

  @override
  Future<void> onFlowCompleted(AdPlacement placement) async {
    if (_policy.shouldShow(DateTime.now()))
      debugPrint('[ads] interstitial slot reached: ${placement.name}');
  }
}

final adsServiceProvider = Provider<AdsService>(
  (ref) => NoopAdsService(InterstitialPolicy()),
);
