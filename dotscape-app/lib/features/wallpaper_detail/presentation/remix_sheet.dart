import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/routes.dart';
import '../../../app/theme/app_theme.dart';
import '../../../shared/models/choices.dart';
import '../../../shared/models/wallpaper.dart';
import '../../../shared/widgets/choice_widgets.dart';
import '../../../shared/widgets/progress_feedback.dart';
import '../../generation/data/generation_repository.dart';

Future<void> startRemix(
  BuildContext context,
  WidgetRef ref,
  Wallpaper wallpaper,
) async {
  final request = await showModalBottomSheet<RemixRequest>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => const RemixSheet(),
  );
  if (request == null || !context.mounted) return;
  final result = await runWithProgress<Wallpaper>(
    context,
    () => ref.read(generationRepositoryProvider).remix(wallpaper.id, request),
    label: 'Remixing…',
  );
  if (result != null && context.mounted)
    context.push(Routes.wallpaper(result.id), extra: result);
}

class RemixSheet extends StatefulWidget {
  const RemixSheet({super.key});

  @override
  State<RemixSheet> createState() => _RemixSheetState();
}

class _RemixSheetState extends State<RemixSheet> {
  final Set<RemixOperation> _operations = {RemixOperation.newComposition};
  ColorChoice? _recolor;

  bool get _canSubmit => _operations.isNotEmpty || _recolor != null;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('REMIX', style: AppText.label),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final op in RemixOperation.values)
                  FilterChip(
                    label: Text(op.label),
                    selected: _operations.contains(op),
                    onSelected: (selected) => setState(
                      () => selected
                          ? _operations.add(op)
                          : _operations.remove(op),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 20),
            const Text('RECOLOR (OPTIONAL)', style: AppText.label),
            const SizedBox(height: 12),
            ColorSwatches(
              selected: _recolor,
              onSelected: (color) =>
                  setState(() => _recolor = _recolor == color ? null : color),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _canSubmit
                    ? () => Navigator.pop(
                        context,
                        RemixRequest(
                          operations: Set.of(_operations),
                          primary: _recolor,
                        ),
                      )
                    : null,
                child: const Text('REMIX IT'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
