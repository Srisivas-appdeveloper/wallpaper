import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/routes.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/analytics/analytics_service.dart';
import '../../../core/storage/local_store.dart';
import '../../../shared/models/choices.dart';
import '../../../shared/models/device_profile.dart';
import '../../../shared/widgets/choice_widgets.dart';
import '../../device/application/device_providers.dart';

enum _Step { welcome, device, vibe }

/// First launch (spec §76): welcome → device detected → choose your vibe. No registration.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  _Step _step = _Step.welcome;
  DeviceProfile? _device;
  StyleChoice _vibe = StyleChoice.liquid;

  Future<void> _finish() async {
    final device = _device;
    if (device == null) return;
    final store = ref.read(localStoreProvider);
    await ref.read(currentDeviceProvider.notifier).select(device);
    await store.writeString(StoreKeys.vibe, _vibe.apiValue);
    await store.writeBool(StoreKeys.onboarded, true);
    ref.read(analyticsProvider).track(AnalyticsEvent.deviceDetected);
    if (mounted) context.go(Routes.home);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: switch (_step) {
              _Step.welcome => _WelcomeStep(
                onContinue: () => setState(() => _step = _Step.device),
              ),
              _Step.device => _DeviceStep(
                onConfirm: (device) => setState(() {
                  _device = device;
                  _step = _Step.vibe;
                }),
              ),
              _Step.vibe => _VibeStep(
                selected: _vibe,
                onSelected: (vibe) => setState(() => _vibe = vibe),
                onFinish: _finish,
              ),
            },
          ),
        ),
      ),
    );
  }
}

class _WelcomeStep extends StatelessWidget {
  const _WelcomeStep({required this.onContinue});

  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: const ValueKey('welcome'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Spacer(),
        const Text('DOTSCAPE', style: AppText.display),
        const SizedBox(height: 16),
        Text(
          'Your phone deserves\nsomething different.',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        const Text(
          'Independent wallpaper app for Nothing phones.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: onContinue,
            child: const Text('CONTINUE'),
          ),
        ),
      ],
    );
  }
}

class _DeviceStep extends ConsumerWidget {
  const _DeviceStep({required this.onConfirm});

  final ValueChanged<DeviceProfile> onConfirm;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detected = ref.watch(detectedDeviceProvider);
    return Column(
      key: const ValueKey('device'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Spacer(),
        const Text('WE DETECTED', style: AppText.label),
        const SizedBox(height: 12),
        detected.when(
          loading: () => const Text('Looking at your phone…'),
          error: (err, stack) => const Text('your phone'),
          data: (device) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                device.marketingName,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                device.isGeneric
                    ? "We'll tune every wallpaper to your ${device.screenWidth}×${device.screenHeight} screen."
                    : "Let's create something for it.",
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: detected.hasValue
                ? () => onConfirm(detected.requireValue)
                : null,
            child: const Text('USE MY DEVICE'),
          ),
        ),
      ],
    );
  }
}

class _VibeStep extends StatelessWidget {
  const _VibeStep({
    required this.selected,
    required this.onSelected,
    required this.onFinish,
  });

  final StyleChoice selected;
  final ValueChanged<StyleChoice> onSelected;
  final VoidCallback onFinish;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: const ValueKey('vibe'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Spacer(),
        const Text('CHOOSE YOUR VIBE', style: AppText.label),
        const SizedBox(height: 16),
        OptionChips<StyleChoice>(
          options: StyleChoice.values,
          selected: selected,
          onSelected: onSelected,
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: onFinish,
            child: const Text("LET'S GO"),
          ),
        ),
      ],
    );
  }
}
