import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';

abstract final class AnalyticsEvent {
  static const appOpen = 'app_open';
  static const deviceDetected = 'device_detected';
  static const view = 'view';
  static const download = 'download';
  static const apply = 'apply';
  static const share = 'share';
  static const favorite = 'favorite';
  static const search = 'search';
}

final analyticsProvider = Provider<AnalyticsService>(
  (ref) => AnalyticsService(ref.watch(apiClientProvider)),
);

/// Fire-and-forget event tracking. Analytics must never break the UX.
class AnalyticsService {
  AnalyticsService(this._api);

  final ApiClient _api;

  void track(String type, {String? wallpaperId}) =>
      unawaited(_send(type, wallpaperId));

  Future<void> _send(String type, String? wallpaperId) async {
    try {
      await _api.post(
        '/v1/events',
        body: {
          'type': type,
          'wallpaper_id': ?wallpaperId,
        },
      );
    } on Object {
      // Intentionally swallowed.
    }
  }
}
