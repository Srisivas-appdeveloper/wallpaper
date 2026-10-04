import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_theme.dart';
import '../../../core/analytics/analytics_service.dart';
import '../../../shared/models/feed.dart';
import '../../../shared/widgets/choice_widgets.dart';
import '../../../shared/widgets/state_views.dart';
import '../../../shared/widgets/wallpaper_grid.dart';
import '../../catalog/application/catalog_providers.dart';
import '../application/explore_controller.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _search = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      ref.read(exploreFiltersProvider.notifier).setQuery(value);
      if (value.trim().isNotEmpty)
        ref.read(analyticsProvider).track(AnalyticsEvent.search);
    });
  }

  bool _onScroll(ScrollNotification notification) {
    if (notification.metrics.extentAfter < 600)
      ref.read(exploreResultsProvider.notifier).loadMore();
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(exploreResultsProvider);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: TextField(
                controller: _search,
                onChanged: _onSearchChanged,
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: 'Search liquid, purple, minimal…',
                  prefixIcon: const Icon(Icons.search),
                  filled: true,
                  fillColor: AppColors.surfaceHigh,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(28),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const _FilterBar(),
            Expanded(
              child: AsyncValueView<WallpaperPage>(
                value: results,
                onRetry: () => ref.invalidate(exploreResultsProvider),
                data: (page) => page.items.isEmpty
                    ? const EmptyState(
                        icon: Icons.blur_on,
                        title: 'Nothing here yet',
                        message: 'Try another style or color.',
                      )
                    : NotificationListener<ScrollNotification>(
                        onNotification: _onScroll,
                        child: CustomScrollView(
                          slivers: [
                            WallpaperGridSliver(items: page.items),
                            if (page.hasMore)
                              const SliverToBoxAdapter(
                                child: Padding(
                                  padding: EdgeInsets.only(bottom: 32),
                                  child: Center(
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterBar extends ConsumerWidget {
  const _FilterBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filters = ref.watch(exploreFiltersProvider);
    final controller = ref.read(exploreFiltersProvider.notifier);
    final categories = ref.watch(categoriesProvider).value ?? const [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 48,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              for (final category in categories)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(category.name),
                    selected: filters.categoryId == category.id,
                    onSelected: (_) => controller.toggleCategory(category.id),
                  ),
                ),
              FilterChip(
                label: const Text('AMOLED'),
                selected: filters.amoledOnly,
                onSelected: (_) => controller.toggleAmoled(),
              ),
              const SizedBox(width: 8),
              FilterChip(
                label: const Text('For my phone'),
                selected: filters.forMyDevice,
                onSelected: (_) => controller.toggleForMyDevice(),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: ColorSwatches(
            selected: filters.color,
            onSelected: controller.toggleColor,
          ),
        ),
      ],
    );
  }
}
