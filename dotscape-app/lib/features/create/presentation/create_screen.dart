import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/routes.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/config/remote_config.dart';
import '../../../core/errors/app_exception.dart';
import '../../../shared/models/choices.dart';
import '../../../shared/models/wallpaper.dart';
import '../../../shared/widgets/choice_widgets.dart';
import '../../../shared/widgets/state_views.dart';
import '../../device/application/device_providers.dart';
import '../application/create_controller.dart';

class CreateScreen extends ConsumerWidget {
  const CreateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen<AsyncValue<Wallpaper?>>(generationControllerProvider, (
      previous,
      next,
    ) {
      if (next case AsyncData(value: final Wallpaper wallpaper)) {
        context.push(Routes.wallpaper(wallpaper.id), extra: wallpaper);
      } else if (next case AsyncError(:final error)) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(userMessageOf(error))));
      }
    });

    final enabled =
        ref
            .watch(remoteConfigProvider)
            .value
            ?.isEnabled(FeatureFlags.aiGeneration) ??
        true;
    if (!enabled) {
      return const Scaffold(
        body: EmptyState(
          icon: Icons.auto_awesome_outlined,
          title: 'Creation is taking a short break',
          message: 'Explore the catalog meanwhile — new drops land daily.',
        ),
      );
    }

    final form = ref.watch(createFormProvider);
    final busy = ref.watch(generationControllerProvider).isLoading;
    final device = ref.watch(currentDeviceProvider);
    final controller = ref.read(createFormProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Create')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
        children: [
          const SectionLabel('Style'),
          OptionChips<StyleChoice>(
            options: StyleChoice.values,
            selected: form.style,
            onSelected: (v) => controller.update((f) => f.copyWith(style: v)),
          ),
          const SectionLabel('Mood'),
          OptionChips<MoodChoice>(
            options: MoodChoice.values,
            selected: form.mood,
            onSelected: (v) => controller.update((f) => f.copyWith(mood: v)),
          ),
          const SectionLabel('Primary color'),
          ColorSwatches(
            selected: form.primary,
            onSelected: (v) => controller.update((f) => f.copyWith(primary: v)),
          ),
          const SectionLabel('Secondary color'),
          ColorSwatches(
            selected: form.secondary,
            onSelected: (v) =>
                controller.update((f) => f.copyWith(secondary: v)),
          ),
          const SectionLabel('Detail'),
          Slider(
            value: form.complexity,
            label: form.complexity < 0.35
                ? 'Minimal'
                : (form.complexity < 0.7 ? 'Balanced' : 'Rich'),
            divisions: 10,
            onChanged: (v) =>
                controller.update((f) => f.copyWith(complexity: v)),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Leave icon-safe space'),
            subtitle: const Text(
              'Keeps the busiest parts away from your clock and icons',
            ),
            value: form.safeArea,
            onChanged: (v) => controller.update((f) => f.copyWith(safeArea: v)),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('AMOLED black'),
            subtitle: const Text('True black background'),
            value: form.amoled,
            onChanged: (v) => controller.update((f) => f.copyWith(amoled: v)),
          ),
          const SizedBox(height: 12),
          Text(
            device == null
                ? 'OPTIMIZED FOR YOUR SCREEN'
                : 'OPTIMIZED FOR ${device.marketingName.toUpperCase()} · ${device.screenWidth}×${device.screenHeight}',
            style: AppText.label,
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: busy
                ? null
                : () => ref
                      .read(generationControllerProvider.notifier)
                      .generate(),
            icon: busy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.auto_awesome),
            label: Text(busy ? 'COMPOSING…' : 'GENERATE'),
          ),
        ],
      ),
    );
  }
}
