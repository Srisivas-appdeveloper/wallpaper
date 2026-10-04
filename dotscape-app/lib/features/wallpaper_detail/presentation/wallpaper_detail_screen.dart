import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_theme.dart';
import '../../../core/analytics/analytics_service.dart';
import '../../../core/config/remote_config.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/models/wallpaper.dart';
import '../../../shared/widgets/progress_feedback.dart';
import '../../../shared/widgets/state_views.dart';
import '../../catalog/application/catalog_providers.dart';
import '../../device/application/device_providers.dart';
import '../../library/application/library_controllers.dart';
import '../application/wallpaper_actions.dart';
import 'apply_sheet.dart';
import 'remix_sheet.dart';
import 'report_dialog.dart';

class WallpaperDetailScreen extends ConsumerStatefulWidget {
  const WallpaperDetailScreen({
    super.key,
    required this.wallpaperId,
    this.initial,
  });

  final String wallpaperId;
  final Wallpaper? initial;

  @override
  ConsumerState<WallpaperDetailScreen> createState() =>
      _WallpaperDetailScreenState();
}

class _WallpaperDetailScreenState extends ConsumerState<WallpaperDetailScreen> {
  bool _chromeVisible = true;

  @override
  void initState() {
    super.initState();
    ref
        .read(analyticsProvider)
        .track(AnalyticsEvent.view, wallpaperId: widget.wallpaperId);
    ref.listenManual(wallpaperByIdProvider(widget.wallpaperId), (
      previous,
      next,
    ) {
      if (next case AsyncData(:final value))
        ref.read(historyProvider.notifier).addToTop(value);
    }, fireImmediately: true);
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(wallpaperByIdProvider(widget.wallpaperId));
    final wallpaper = async.value ?? widget.initial;

    if (wallpaper == null) {
      return Scaffold(
        appBar: AppBar(),
        body: async.hasError
            ? ErrorView(
                message: userMessageOf(async.error!),
                onRetry: () =>
                    ref.invalidate(wallpaperByIdProvider(widget.wallpaperId)),
              )
            : const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leading: _chromeVisible ? const BackButton() : null,
        actions: [if (_chromeVisible) _MoreMenu(wallpaper: wallpaper)],
      ),
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => setState(() => _chromeVisible = !_chromeVisible),
        child: Stack(
          fit: StackFit.expand,
          children: [
            CachedNetworkImage(
              imageUrl: wallpaper.previewUrl,
              fit: BoxFit.cover,
              placeholder: (context, url) => CachedNetworkImage(
                imageUrl: wallpaper.thumbnailUrl,
                fit: BoxFit.cover,
              ),
              errorWidget: (context, url, error) =>
                  const Center(child: Icon(Icons.broken_image_outlined)),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: IgnorePointer(
                ignoring: !_chromeVisible,
                child: AnimatedOpacity(
                  opacity: _chromeVisible ? 1 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: _DetailPanel(wallpaper: wallpaper),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MoreMenu extends ConsumerWidget {
  const _MoreMenu({required this.wallpaper});

  final Wallpaper wallpaper;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PopupMenuButton<String>(
      onSelected: (_) => showReportDialog(context, ref, wallpaper),
      itemBuilder: (context) => const [
        PopupMenuItem(value: 'report', child: Text('Report')),
      ],
    );
  }
}

class _DetailPanel extends ConsumerWidget {
  const _DetailPanel({required this.wallpaper});

  final Wallpaper wallpaper;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final device = ref.watch(currentDeviceProvider);
    final isFavorite = ref.watch(isFavoriteProvider(wallpaper.id));
    final remixEnabled =
        ref.watch(remoteConfigProvider).value?.isEnabled(FeatureFlags.remix) ??
        true;
    final madeFor = wallpaper.isMadeFor(device?.id)
        ? 'MADE FOR ${device!.marketingName.toUpperCase()}'
        : 'WORKS ON ANY ANDROID PHONE';

    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.transparent, Colors.black87, Colors.black],
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 56, 20, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                wallpaper.title,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 6),
              Text(madeFor, style: AppText.label),
              if (wallpaper.downloadCount > 0) ...[
                const SizedBox(height: 4),
                Text(
                  '${wallpaper.downloadCount} downloads',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => showApplySheet(context, ref, wallpaper),
                  icon: const Icon(Icons.wallpaper),
                  label: const Text('APPLY'),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _ActionButton(
                    icon: Icons.download_outlined,
                    label: 'Download',
                    onTap: () => runWithProgress<void>(
                      context,
                      () => ref
                          .read(wallpaperActionsProvider)
                          .download(wallpaper),
                      label: 'Saving…',
                      successMessage: 'Saved to Pictures/DOTSCAPE',
                    ),
                  ),
                  if (wallpaper.remixable && remixEnabled)
                    _ActionButton(
                      icon: Icons.auto_awesome_outlined,
                      label: 'Remix',
                      onTap: () => startRemix(context, ref, wallpaper),
                    ),
                  _ActionButton(
                    icon: isFavorite ? Icons.favorite : Icons.favorite_border,
                    label: isFavorite ? 'Saved' : 'Save',
                    onTap: () =>
                        ref.read(favoritesProvider.notifier).toggle(wallpaper),
                  ),
                  _ActionButton(
                    icon: Icons.share_outlined,
                    label: 'Share',
                    onTap: () =>
                        ref.read(wallpaperActionsProvider).share(wallpaper),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: InkResponse(
        onTap: onTap,
        radius: 36,
        child: SizedBox(
          width: 72,
          height: 64,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon),
              const SizedBox(height: 4),
              Text(label, style: Theme.of(context).textTheme.labelSmall),
            ],
          ),
        ),
      ),
    );
  }
}
