import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/routes.dart';
import '../../../app/theme/app_theme.dart';
import '../../../shared/models/feed.dart';
import '../../../shared/models/wallpaper.dart';
import '../../../shared/widgets/state_views.dart';
import '../../../shared/widgets/wallpaper_card.dart';
import '../../device/application/device_providers.dart';
import '../../wallpaper_detail/presentation/apply_sheet.dart';
import '../../wallpaper_detail/presentation/remix_sheet.dart';
import '../application/home_providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(homeFeedProvider);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: AsyncValueView<HomeFeed>(
          value: feed,
          onRetry: () => ref.invalidate(homeFeedProvider),
          data: (feed) => RefreshIndicator(
            onRefresh: () => ref.refresh(homeFeedProvider.future),
            child: CustomScrollView(
              slivers: [
                const SliverToBoxAdapter(child: _Header()),
                if (feed.isFromCache)
                  const SliverToBoxAdapter(child: _OfflineBanner()),
                if (feed.hero != null)
                  SliverToBoxAdapter(child: _HeroCard(wallpaper: feed.hero!)),
                for (final section in feed.sections)
                  SliverToBoxAdapter(child: _SectionRow(section: section)),
                const SliverToBoxAdapter(child: SizedBox(height: 32)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Header extends ConsumerWidget {
  const _Header();

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final device = ref.watch(currentDeviceProvider);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_greeting(), style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 4),
          Text(
            'MADE FOR ${(device?.marketingName ?? 'your phone').toUpperCase()}',
            style: AppText.label,
          ),
        ],
      ),
    );
  }
}

class _OfflineBanner extends StatelessWidget {
  const _OfflineBanner();

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: AppColors.surfaceHigh,
      borderRadius: BorderRadius.circular(12),
    ),
    child: const Text("You're offline. Showing your last loaded feed."),
  );
}

class _HeroCard extends ConsumerWidget {
  const _HeroCard({required this.wallpaper});

  final Wallpaper wallpaper;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GestureDetector(
        onTap: () =>
            context.push(Routes.wallpaper(wallpaper.id), extra: wallpaper),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: AspectRatio(
            aspectRatio: 4 / 5,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CachedNetworkImage(
                  imageUrl: wallpaper.previewUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) =>
                      const ColoredBox(color: AppColors.surfaceHigh),
                ),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Colors.black87],
                      stops: [0.45, 1],
                    ),
                  ),
                ),
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 20,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("TODAY'S WALLPAPER", style: AppText.label),
                      const SizedBox(height: 6),
                      Text(
                        wallpaper.title,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: FilledButton(
                              onPressed: () =>
                                  showApplySheet(context, ref, wallpaper),
                              child: const Text('APPLY'),
                            ),
                          ),
                          if (wallpaper.remixable) ...[
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () =>
                                    startRemix(context, ref, wallpaper),
                                child: const Text('REMIX'),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionRow extends StatelessWidget {
  const _SectionRow({required this.section});

  final FeedSection section;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
          child: Text(section.title.toUpperCase(), style: AppText.label),
        ),
        SizedBox(
          height: 250,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: section.items.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) => SizedBox(
              width: 115,
              child: WallpaperCard(wallpaper: section.items[index]),
            ),
          ),
        ),
      ],
    );
  }
}
