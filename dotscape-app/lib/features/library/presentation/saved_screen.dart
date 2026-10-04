import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/wallpaper.dart';
import '../../../shared/widgets/state_views.dart';
import '../../../shared/widgets/wallpaper_grid.dart';
import '../application/library_controllers.dart';

class SavedScreen extends ConsumerWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Saved'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Favorites'),
              Tab(text: 'Downloads'),
              Tab(text: 'Recent'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _LocalGrid(
              items: ref.watch(favoritesProvider),
              empty: const EmptyState(
                icon: Icons.favorite_border,
                title: 'No favorites yet',
                message: 'Save wallpapers you love and they will appear here.',
              ),
            ),
            _LocalGrid(
              items: ref.watch(downloadsProvider),
              empty: const EmptyState(
                icon: Icons.download_outlined,
                title: 'No downloads yet',
                message:
                    'Downloaded wallpapers are saved to Pictures/DOTSCAPE.',
              ),
            ),
            _LocalGrid(
              items: ref.watch(historyProvider),
              empty: const EmptyState(
                icon: Icons.history,
                title: 'Nothing viewed yet',
                message: 'Wallpapers you open will show up here.',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LocalGrid extends StatelessWidget {
  const _LocalGrid({required this.items, required this.empty});

  final List<Wallpaper> items;
  final Widget empty;

  @override
  Widget build(BuildContext context) => items.isEmpty
      ? empty
      : CustomScrollView(slivers: [WallpaperGridSliver(items: items)]);
}
