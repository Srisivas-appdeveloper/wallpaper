import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/models/choices.dart';
import '../../../shared/models/device_profile.dart';
import '../../../shared/models/wallpaper.dart';

@immutable
class CreateForm {
  const CreateForm({
    required this.style,
    required this.mood,
    required this.primary,
    required this.secondary,
    this.complexity = 0.5,
    this.amoled = false,
    this.safeArea = true,
  });

  final StyleChoice style;
  final MoodChoice mood;
  final ColorChoice primary;
  final ColorChoice secondary;
  final double complexity;
  final bool amoled;
  final bool safeArea;

  CreateForm copyWith({
    StyleChoice? style,
    MoodChoice? mood,
    ColorChoice? primary,
    ColorChoice? secondary,
    double? complexity,
    bool? amoled,
    bool? safeArea,
  }) => CreateForm(
    style: style ?? this.style,
    mood: mood ?? this.mood,
    primary: primary ?? this.primary,
    secondary: secondary ?? this.secondary,
    complexity: complexity ?? this.complexity,
    amoled: amoled ?? this.amoled,
    safeArea: safeArea ?? this.safeArea,
  );
}

@immutable
class RemixRequest {
  const RemixRequest({required this.operations, this.primary});

  final Set<RemixOperation> operations;
  final ColorChoice? primary;
}

final generationRepositoryProvider = Provider<GenerationRepository>(
  (ref) => GenerationRepository(ref.watch(apiClientProvider)),
);

/// All generation happens server-side (provider keys never live in the APK).
class GenerationRepository {
  GenerationRepository(this._api);

  final ApiClient _api;

  Future<Wallpaper> generate(CreateForm form, DeviceProfile? device) async {
    final json = await _api.post(
      '/v1/generate',
      body: {
        'style': form.style.apiValue,
        'mood': form.mood.apiValue,
        'primary': form.primary.apiValue,
        'secondary': form.secondary.apiValue,
        'complexity': form.complexity,
        'amoled': form.amoled,
        'safeArea': form.safeArea,
        if (device != null) ...{
          'deviceId': device.id,
          'screenWidth': device.screenWidth,
          'screenHeight': device.screenHeight,
        },
      },
    );
    return Wallpaper.fromJson(json['wallpaper'] as Map<String, dynamic>);
  }

  Future<Wallpaper> remix(String wallpaperId, RemixRequest request) async {
    final json = await _api.post(
      '/v1/remix',
      body: {
        'wallpaperId': wallpaperId,
        'operations': request.operations.map((op) => op.apiValue).toList(),
        if (request.primary != null) 'primary': request.primary!.apiValue,
      },
    );
    return Wallpaper.fromJson(json['wallpaper'] as Map<String, dynamic>);
  }
}
