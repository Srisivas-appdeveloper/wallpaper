import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/models/feed.dart';
import '../../../shared/models/wallpaper.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.watch(apiClientProvider)),
);

class CatalogRepository {
  CatalogRepository(this._api);

  final ApiClient _api;

  Future<WallpaperPage> list({
    String? query,
    String? categoryId,
    String? color,
    bool amoledOnly = false,
    String? deviceId,
    bool deviceStrict = false,
    int offset = 0,
    int limit = 24,
  }) async {
    final json = await _api.get(
      '/v1/wallpapers',
      query: {
        'q': query,
        'categoryId': categoryId,
        'color': color,
        'amoled': amoledOnly ? 'true' : null,
        'deviceId': deviceId,
        'deviceStrict': deviceStrict ? 'true' : null,
        'offset': offset,
        'limit': limit,
      },
    );
    return WallpaperPage.fromJson(json);
  }

  Future<Wallpaper> byId(String id) async {
    final json = await _api.get('/v1/wallpapers/$id');
    return Wallpaper.fromJson(json['wallpaper'] as Map<String, dynamic>);
  }

  Future<List<WallpaperCategory>> categories() async {
    final json = await _api.get('/v1/categories');
    final items = json['items'];
    return items is List
        ? items
              .whereType<Map<String, dynamic>>()
              .map(WallpaperCategory.fromJson)
              .toList()
        : const [];
  }
}
