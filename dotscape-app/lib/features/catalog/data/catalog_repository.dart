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
    final Map<String, Object?> params = {
      'select': '*',
      'status': 'eq.published',
      'order': 'created_at.desc',
      'offset': offset,
      'limit': limit,
    };

    if (categoryId != null &&
        categoryId.isNotEmpty &&
        categoryId.toLowerCase() != 'all') {
      params['category_id'] = 'eq.$categoryId';
    }

    if (amoledOnly) {
      params['is_amoled'] = 'eq.true';
    }

    if (query != null && query.trim().isNotEmpty) {
      final q = query.trim();
      params['title'] = 'ilike.*$q*';
    }

    if (color != null && color.isNotEmpty) {
      params['colors'] = 'cs.{"$color"}';
    }

    final list = await _api.getList('/wallpapers', query: params);
    final items = list
        .whereType<Map<String, dynamic>>()
        .map(Wallpaper.fromJson)
        .toList(growable: false);

    final nextOffset = items.length == limit ? offset + limit : null;
    return WallpaperPage(items: items, nextOffset: nextOffset);
  }

  Future<Wallpaper> byId(String id) async {
    final json = await _api.get(
      '/wallpapers',
      query: {
        'id': 'eq.$id',
        'select': '*',
      },
      headers: {
        'Accept': 'application/vnd.pgrst.object+json',
      },
    );
    return Wallpaper.fromJson(json);
  }

  Future<List<WallpaperCategory>> categories() async {
    final list = await _api.getList(
      '/categories',
      query: {
        'select': '*',
        'order': 'sort_order.asc',
      },
    );
    return list
        .whereType<Map<String, dynamic>>()
        .map(WallpaperCategory.fromJson)
        .toList();
  }
}
