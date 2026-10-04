import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/app_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_store.dart';
import '../../../shared/models/feed.dart';

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

  /// Network first; falls back to the last successful feed when offline (spec §41-42).
  Future<HomeFeed> fetch({String? deviceId}) async {
    try {
      final json = await _api.get('/v1/home', query: {'deviceId': deviceId});
      await _store.writeJson(StoreKeys.homeCache, json);
      return HomeFeed.fromJson(json);
    } on AppException catch (error) {
      final cached = error.isConnectivity
          ? _store.readJson(StoreKeys.homeCache)
          : null;
      if (cached == null) rethrow;
      return HomeFeed.fromJson(cached, isFromCache: true);
    }
  }
}
