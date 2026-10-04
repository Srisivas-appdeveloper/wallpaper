import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/analytics/analytics_service.dart';
import '../../../core/storage/local_store.dart';
import '../../../shared/models/wallpaper.dart';

/// A locally persisted, newest-first list of wallpaper snapshots.
abstract class StoredWallpaperList extends Notifier<List<Wallpaper>> {
  String get storageKey;
  int get maxItems;

  @override
  List<Wallpaper> build() => ref
      .read(localStoreProvider)
      .readJsonList(storageKey)
      .map(Wallpaper.fromJson)
      .toList();

  bool contains(String id) => state.any((w) => w.id == id);

  Future<void> addToTop(Wallpaper wallpaper) async {
    state = [
      wallpaper,
      ...state.where((w) => w.id != wallpaper.id),
    ].take(maxItems).toList();
    await _persist();
  }

  Future<void> remove(String id) async {
    state = state.where((w) => w.id != id).toList();
    await _persist();
  }

  Future<void> _persist() => ref
      .read(localStoreProvider)
      .writeJsonList(storageKey, state.map((w) => w.toJson()).toList());
}

class FavoritesController extends StoredWallpaperList {
  @override
  String get storageKey => StoreKeys.favorites;
  @override
  int get maxItems => 500;

  Future<void> toggle(Wallpaper wallpaper) async {
    if (contains(wallpaper.id)) return remove(wallpaper.id);
    await addToTop(wallpaper);
    ref
        .read(analyticsProvider)
        .track(AnalyticsEvent.favorite, wallpaperId: wallpaper.id);
  }
}

class DownloadsController extends StoredWallpaperList {
  @override
  String get storageKey => StoreKeys.downloads;
  @override
  int get maxItems => 200;
}

class HistoryController extends StoredWallpaperList {
  @override
  String get storageKey => StoreKeys.history;
  @override
  int get maxItems => 40;
}

final favoritesProvider =
    NotifierProvider<FavoritesController, List<Wallpaper>>(
      FavoritesController.new,
    );
final downloadsProvider =
    NotifierProvider<DownloadsController, List<Wallpaper>>(
      DownloadsController.new,
    );
final historyProvider = NotifierProvider<HistoryController, List<Wallpaper>>(
  HistoryController.new,
);

final isFavoriteProvider = Provider.family<bool, String>(
  (ref, id) => ref.watch(favoritesProvider).any((w) => w.id == id),
);
