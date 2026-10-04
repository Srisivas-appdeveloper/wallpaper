import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/feed.dart';
import '../../../shared/models/wallpaper.dart';
import '../data/catalog_repository.dart';

final wallpaperByIdProvider = FutureProvider.autoDispose
    .family<Wallpaper, String>(
      (ref, id) => ref.watch(catalogRepositoryProvider).byId(id),
    );

final categoriesProvider = FutureProvider<List<WallpaperCategory>>(
  (ref) => ref.watch(catalogRepositoryProvider).categories(),
);
