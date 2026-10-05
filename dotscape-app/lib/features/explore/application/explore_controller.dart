import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/app_exception.dart';
import '../../../shared/models/choices.dart';
import '../../../shared/models/feed.dart';
import '../../catalog/data/catalog_repository.dart';
import '../../device/application/device_providers.dart';

@immutable
class ExploreFilters {
  const ExploreFilters({
    this.query = '',
    this.categoryId,
    this.color,
    this.amoledOnly = false,
    this.forMyDevice = false,
  });

  final String query;
  final String? categoryId;
  final ColorChoice? color;
  final bool amoledOnly;
  final bool forMyDevice;

  /// Nullable fields use ValueGetter so they can be explicitly cleared.
  ExploreFilters copyWith({
    String? query,
    ValueGetter<String?>? categoryId,
    ValueGetter<ColorChoice?>? color,
    bool? amoledOnly,
    bool? forMyDevice,
  }) => ExploreFilters(
    query: query ?? this.query,
    categoryId: categoryId != null ? categoryId() : this.categoryId,
    color: color != null ? color() : this.color,
    amoledOnly: amoledOnly ?? this.amoledOnly,
    forMyDevice: forMyDevice ?? this.forMyDevice,
  );
}

final exploreFiltersProvider =
    NotifierProvider<ExploreFiltersController, ExploreFilters>(
      ExploreFiltersController.new,
    );

class ExploreFiltersController extends Notifier<ExploreFilters> {
  @override
  ExploreFilters build() => const ExploreFilters();

  void setQuery(String query) => state = state.copyWith(query: query.trim());

  void toggleCategory(String? id) => state = state.copyWith(
    categoryId: () => state.categoryId == id ? null : id,
  );

  void toggleColor(ColorChoice color) =>
      state = state.copyWith(color: () => state.color == color ? null : color);

  void toggleAmoled() => state = state.copyWith(amoledOnly: !state.amoledOnly);

  void toggleForMyDevice() =>
      state = state.copyWith(forMyDevice: !state.forMyDevice);
}

final exploreResultsProvider =
    AsyncNotifierProvider.autoDispose<ExploreResultsController, WallpaperPage>(
      ExploreResultsController.new,
    );

class ExploreResultsController extends AsyncNotifier<WallpaperPage> {
  bool _loadingMore = false;

  @override
  Future<WallpaperPage> build() {
    final filters = ref.watch(exploreFiltersProvider);
    final deviceId = ref.watch(currentDeviceProvider.select((d) => d?.id));
    return _fetch(filters, deviceId, offset: 0);
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || !current.hasMore || _loadingMore || state.isLoading) {
      return;
    }
    final filters = ref.read(exploreFiltersProvider);
    _loadingMore = true;
    try {
      final next = await _fetch(
        filters,
        ref.read(currentDeviceProvider)?.id,
        offset: current.nextOffset!,
      );
      if (identical(filters, ref.read(exploreFiltersProvider))) {
        state = AsyncData(current.append(next));
      }
    } on AppException {
      // Keep the current page; the next scroll retries.
    } finally {
      _loadingMore = false;
    }
  }

  Future<WallpaperPage> _fetch(
    ExploreFilters f,
    String? deviceId, {
    required int offset,
  }) => ref
      .read(catalogRepositoryProvider)
      .list(
        query: f.query.isEmpty ? null : f.query,
        categoryId: f.categoryId,
        color: f.color?.apiValue,
        amoledOnly: f.amoledOnly,
        deviceId: f.forMyDevice ? deviceId : null,
        deviceStrict: f.forMyDevice,
        offset: offset,
      );
}
