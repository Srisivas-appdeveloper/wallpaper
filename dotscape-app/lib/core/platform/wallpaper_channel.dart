import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../errors/app_exception.dart';

enum WallpaperTarget {
  home('Home screen'),
  lock('Lock screen'),
  both('Home & lock screen');

  const WallpaperTarget(this.label);
  final String label;
}

final wallpaperChannelProvider = Provider<WallpaperChannel>(
  (ref) => const WallpaperChannel(),
);

/// Dart side of the native `WallpaperChannelHandler.kt`.
class WallpaperChannel {
  const WallpaperChannel();

  static const _channel = MethodChannel('dotscape/wallpaper');

  Future<void> setWallpaper(String path, WallpaperTarget target) => _invoke(
    'setWallpaper',
    {'path': path, 'target': target.name},
    "Couldn't apply the wallpaper. Try again.",
  );

  Future<void> saveToGallery(String path, String displayName) => _invoke(
    'saveToGallery',
    {'path': path, 'displayName': displayName},
    'Download failed. Try again.',
  );

  Future<void> shareText(String text) =>
      _invoke('shareText', {'text': text}, "Couldn't open sharing.");

  Future<void> _invoke(
    String method,
    Map<String, Object?> args,
    String failureMessage,
  ) async {
    try {
      await _channel.invokeMethod<void>(method, args);
    } on PlatformException {
      throw AppException(AppErrorKind.platform, failureMessage);
    } on MissingPluginException {
      throw AppException(AppErrorKind.platform, failureMessage);
    }
  }
}
