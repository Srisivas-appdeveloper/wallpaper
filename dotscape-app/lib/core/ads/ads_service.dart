import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

enum AdPlacement {
  afterApply,
  afterDownload,
  afterShare,
  afterRemix,
  afterCreate,
}

abstract interface class AdsService {
  Future<void> onFlowCompleted(AdPlacement placement);
  void preload();
}

/// Controls spacing of interstitial ads. Defaults to immediate (every action).
class InterstitialPolicy {
  InterstitialPolicy({
    this.minFlowsBetween = 1,
    this.minInterval = Duration.zero,
  });

  final int minFlowsBetween;
  final Duration minInterval;
  int _flows = 0;
  DateTime? _lastShown;

  bool shouldShow(DateTime now) {
    _flows++;
    final spacedOut =
        _lastShown == null || minInterval == Duration.zero || now.difference(_lastShown!) >= minInterval;
    if (_flows < minFlowsBetween || !spacedOut) return false;
    _flows = 0;
    _lastShown = now;
    return true;
  }
}

/// Google AdMob implementation for real mobile devices.
class AdMobAdsService implements AdsService {
  AdMobAdsService(this._policy, {String? adUnitId})
      : _adUnitId = adUnitId ??
            (defaultTargetPlatform == TargetPlatform.android
                ? 'ca-app-pub-3940256099942544/1033173712'
                : 'ca-app-pub-3940256099942544/4411468910') {
    unawaited(_loadInterstitial());
  }

  final InterstitialPolicy _policy;
  final String _adUnitId;
  InterstitialAd? _interstitialAd;
  Completer<InterstitialAd?>? _loadCompleter;

  @override
  void preload() {
    unawaited(_loadInterstitial());
  }

  Future<InterstitialAd?> _loadInterstitial() {
    if (_interstitialAd != null) {
      return Future.value(_interstitialAd);
    }
    if (_loadCompleter != null) {
      return _loadCompleter!.future;
    }
    final completer = Completer<InterstitialAd?>();
    _loadCompleter = completer;

    InterstitialAd.load(
      adUnitId: _adUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _loadCompleter = null;
          completer.complete(ad);
          debugPrint('[ads] AdMob interstitial ad loaded and ready');
        },
        onAdFailedToLoad: (error) {
          _interstitialAd = null;
          _loadCompleter = null;
          completer.complete(null);
          debugPrint('[ads] AdMob interstitial failed to load: $error');
        },
      ),
    );
    return completer.future;
  }

  @override
  Future<void> onFlowCompleted(AdPlacement placement) async {
    debugPrint('[ads] onFlowCompleted triggered for: ${placement.name}');
    if (!_policy.shouldShow(DateTime.now())) {
      debugPrint('[ads] Interstitial skipped by policy');
      return;
    }

    var ad = _interstitialAd;
    if (ad == null) {
      debugPrint('[ads] Interstitial ad not cached yet, waiting up to 3.5s for load...');
      try {
        ad = await _loadInterstitial().timeout(const Duration(milliseconds: 3500));
      } catch (e) {
        debugPrint('[ads] Timed out waiting for ad load: $e');
        ad = null;
      }
    }

    if (ad != null) {
      final dismissedCompleter = Completer<void>();
      ad.fullScreenContentCallback = FullScreenContentCallback(
        onAdShowedFullScreenContent: (ad) {
          debugPrint('[ads] Interstitial ad showing on screen');
        },
        onAdDismissedFullScreenContent: (ad) {
          debugPrint('[ads] Interstitial ad dismissed by user');
          ad.dispose();
          _interstitialAd = null;
          unawaited(_loadInterstitial());
          if (!dismissedCompleter.isCompleted) dismissedCompleter.complete();
        },
        onAdFailedToShowFullScreenContent: (ad, error) {
          debugPrint('[ads] Interstitial ad failed to show: $error');
          ad.dispose();
          _interstitialAd = null;
          unawaited(_loadInterstitial());
          if (!dismissedCompleter.isCompleted) dismissedCompleter.complete();
        },
      );
      _interstitialAd = null;
      await ad.show();
      await dismissedCompleter.future.timeout(
        const Duration(seconds: 30),
        onTimeout: () {},
      );
    } else {
      debugPrint('[ads] Ad unavailable right now, pre-fetching for next action');
      unawaited(_loadInterstitial());
    }
  }
}

class NoopAdsService implements AdsService {
  NoopAdsService(this._policy);

  final InterstitialPolicy _policy;

  @override
  void preload() {}

  @override
  Future<void> onFlowCompleted(AdPlacement placement) async {
    if (_policy.shouldShow(DateTime.now())) {
      debugPrint(
        '[ads] simulated interstitial slot reached: ${placement.name}',
      );
    }
  }
}

final adsServiceProvider = Provider<AdsService>((ref) {
  final isMobile = !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);
  return isMobile
      ? AdMobAdsService(InterstitialPolicy())
      : NoopAdsService(InterstitialPolicy());
});
