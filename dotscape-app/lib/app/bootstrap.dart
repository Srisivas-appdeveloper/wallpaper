import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/ads/ads_service.dart';
import '../core/storage/local_store.dart';
import 'app.dart';
import 'config/app_config.dart';

Future<void> bootstrap(AppConfig config) async {
  WidgetsFlutterBinding.ensureInitialized();
  _installErrorHandlers();

  if (!kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS)) {
    try {
      await MobileAds.instance.initialize();
      await MobileAds.instance.updateRequestConfiguration(
        RequestConfiguration(
          testDeviceIds: const ['E2107502E3ACF1A0EF2C594C3CE42415'],
        ),
      );
    } catch (e) {
      debugPrint('[ads] Failed to initialize MobileAds: $e');
    }
  }

  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(
    SystemUiOverlayStyle.light.copyWith(
      statusBarColor: Colors.transparent,
      systemNavigationBarColor: Colors.black,
    ),
  );

  final prefs = await SharedPreferences.getInstance();

  final container = ProviderContainer(
    overrides: [
      appConfigProvider.overrideWithValue(config),
      sharedPreferencesProvider.overrideWithValue(prefs),
    ],
  );

  // Eagerly preload interstitial ad so it is ready before user interactions
  container.read(adsServiceProvider).preload();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const DotscapeApp(),
    ),
  );
}

/// Crash-reporting hook: forward these to Crashlytics or Sentry.
void _installErrorHandlers() {
  FlutterError.onError = FlutterError.presentError;
  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('Uncaught error: $error\n$stack');
    return true;
  };
}
