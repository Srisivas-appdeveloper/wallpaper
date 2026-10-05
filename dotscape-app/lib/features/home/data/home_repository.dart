import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/app_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_store.dart';
import '../../../shared/models/feed.dart';
import '../../../shared/models/wallpaper.dart';

final homeRepositoryProvider = Provider<HomeRepository>(
  (ref) => HomeRepository(
    ref.watch(apiClientProvider),
    ref.watch(localStoreProvider),
  ),
);

class HomeRepository {
  HomeRepository(this._api, this._store);

  final ApiClient _api;
  final LocalStore _store;

  /// Network first; falls back to the last successful feed when offline.
  Future<HomeFeed> fetch({String? deviceId}) async {
    try {
      final results = await Future.wait([
        // 0: Featured (Hero)
        _api.getList(
          '/wallpapers',
          query: {
            'select': '*',
            'status': 'eq.published',
            'order': 'is_featured.desc,created_at.desc',
            'limit': 1,
          },
        ),
        // 1: Trending
        _api.getList(
          '/wallpapers',
          query: {
            'select': '*',
            'status': 'eq.published',
            'order': 'apply_count.desc,download_count.desc,created_at.desc',
            'limit': 12,
          },
        ),
        // 2: New drops
        _api.getList(
          '/wallpapers',
          query: {
            'select': '*',
            'status': 'eq.published',
            'order': 'created_at.desc',
            'limit': 12,
          },
        ),
        // 3: AMOLED
        _api.getList(
          '/wallpapers',
          query: {
            'select': '*',
            'status': 'eq.published',
            'is_amoled': 'eq.true',
            'order': 'created_at.desc',
            'limit': 12,
          },
        ),
      ]);

      final featuredList = results[0]
          .whereType<Map<String, dynamic>>()
          .map(Wallpaper.fromJson)
          .toList();
      final trendingList = results[1]
          .whereType<Map<String, dynamic>>()
          .map(Wallpaper.fromJson)
          .toList();
      final freshList = results[2]
          .whereType<Map<String, dynamic>>()
          .map(Wallpaper.fromJson)
          .toList();
      final amoledList = results[3]
          .whereType<Map<String, dynamic>>()
          .map(Wallpaper.fromJson)
          .toList();

      final hero = featuredList.isNotEmpty
          ? featuredList.first
          : (freshList.isNotEmpty ? freshList.first : null);

      final sections = <FeedSection>[
        if (trendingList.isNotEmpty)
          FeedSection(
            id: 'trending',
            title: 'Trending now',
            items: trendingList,
          ),
        if (freshList.isNotEmpty)
          FeedSection(id: 'new', title: 'New drops', items: freshList),
        if (amoledList.isNotEmpty)
          FeedSection(id: 'amoled', title: 'AMOLED', items: amoledList),
      ];

      final feed = HomeFeed(hero: hero, sections: sections);
      await _store.writeJson(StoreKeys.homeCache, feed.toJson());
      return feed;
    } on Object catch (error) {
      final cached = _store.readJson(StoreKeys.homeCache);
      if (cached != null) {
        return HomeFeed.fromJson(cached, isFromCache: true);
      }
      if (error is AppException) rethrow;
      throw const AppException(
        AppErrorKind.unknown,
        'Could not load home feed.',
      );
    }
  }
}
