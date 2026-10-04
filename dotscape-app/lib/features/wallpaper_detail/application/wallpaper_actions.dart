import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/ads/ads_service.dart';
import '../../../core/analytics/analytics_service.dart';
import '../../../core/network/api_client.dart';
import '../../../core/platform/wallpaper_channel.dart';
import '../../../shared/models/choices.dart';
import '../../../shared/models/wallpaper.dart';
import '../../library/application/library_controllers.dart';

final wallpaperActionsProvider = Provider<WallpaperActions>(
  WallpaperActions.new,
);

/// User actions on a wallpaper. Each method is one small, readable flow.
class WallpaperActions {
  WallpaperActions(this._ref);

  final Ref _ref;

  Future<void> apply(Wallpaper wallpaper, WallpaperTarget target) async {
    final file = await _fullResolution(wallpaper);
    await _ref.read(wallpaperChannelProvider).setWallpaper(file.path, target);
    _ref
        .read(analyticsProvider)
        .track(AnalyticsEvent.apply, wallpaperId: wallpaper.id);
    await _ref.read(adsServiceProvider).onFlowCompleted(AdPlacement.afterApply);
  }

  Future<void> download(Wallpaper wallpaper) async {
    final file = await _fullResolution(wallpaper);
    await _ref
        .read(wallpaperChannelProvider)
        .saveToGallery(
          file.path,
          'DOTSCAPE_${wallpaper.id.substring(0, 8)}.jpg',
        );
    _ref
        .read(analyticsProvider)
        .track(AnalyticsEvent.download, wallpaperId: wallpaper.id);
    await _ref.read(downloadsProvider.notifier).addToTop(wallpaper);
    await _ref
        .read(adsServiceProvider)
        .onFlowCompleted(AdPlacement.afterDownload);
  }

  Future<void> share(Wallpaper wallpaper) async {
    await _ref
        .read(wallpaperChannelProvider)
        .shareText(
          '${wallpaper.title} — made with DOTSCAPE\n${wallpaper.previewUrl}',
        );
    _ref
        .read(analyticsProvider)
        .track(AnalyticsEvent.share, wallpaperId: wallpaper.id);
  }

  Future<void> report(Wallpaper wallpaper, ReportReason reason) async {
    await _ref
        .read(apiClientProvider)
        .post(
          '/v1/reports',
          body: {'wallpaperId': wallpaper.id, 'reason': reason.apiValue},
        );
  }

  Future<File> _fullResolution(Wallpaper wallpaper) => _ref
      .read(apiClientProvider)
      .downloadFile(wallpaper.fullUrl, 'dotscape_${wallpaper.id}.jpg');
}
