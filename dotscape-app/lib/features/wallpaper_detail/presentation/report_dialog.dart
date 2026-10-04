import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/choices.dart';
import '../../../shared/models/wallpaper.dart';
import '../../../shared/widgets/progress_feedback.dart';
import '../application/wallpaper_actions.dart';

Future<void> showReportDialog(
  BuildContext context,
  WidgetRef ref,
  Wallpaper wallpaper,
) async {
  final reason = await showDialog<ReportReason>(
    context: context,
    builder: (dialogContext) => SimpleDialog(
      title: const Text('Report wallpaper'),
      children: [
        for (final reason in ReportReason.values)
          SimpleDialogOption(
            onPressed: () => Navigator.pop(dialogContext, reason),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(reason.label),
            ),
          ),
      ],
    ),
  );
  if (reason == null || !context.mounted) return;
  await runWithProgress<void>(
    context,
    () => ref.read(wallpaperActionsProvider).report(wallpaper, reason),
    label: 'Sending…',
    successMessage: 'Thanks — our team will review it.',
  );
}
