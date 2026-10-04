import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_theme.dart';
import '../../../core/platform/wallpaper_channel.dart';
import '../../../shared/models/wallpaper.dart';
import '../../../shared/widgets/progress_feedback.dart';
import '../application/wallpaper_actions.dart';

const _targetIcons = {
  WallpaperTarget.home: Icons.home_outlined,
  WallpaperTarget.lock: Icons.lock_outline,
  WallpaperTarget.both: Icons.smartphone,
};

Future<void> showApplySheet(
  BuildContext context,
  WidgetRef ref,
  Wallpaper wallpaper,
) async {
  final target = await showModalBottomSheet<WallpaperTarget>(
    context: context,
    showDragHandle: true,
    builder: (sheetContext) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(24, 0, 24, 8),
            child: Text('APPLY TO', style: AppText.label),
          ),
          for (final target in WallpaperTarget.values)
            ListTile(
              leading: Icon(_targetIcons[target]),
              title: Text(target.label),
              onTap: () => Navigator.pop(sheetContext, target),
            ),
          const SizedBox(height: 8),
        ],
      ),
    ),
  );
  if (target == null || !context.mounted) return;
  await runWithProgress<void>(
    context,
    () => ref.read(wallpaperActionsProvider).apply(wallpaper, target),
    label: 'Applying…',
    successMessage: 'Wallpaper applied',
  );
}
