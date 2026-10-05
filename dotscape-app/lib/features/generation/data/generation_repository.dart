import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/app_exception.dart';
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

/// 100% Serverless Generation: Queries matching procedural styles directly from Supabase Cloud.
class GenerationRepository {
  GenerationRepository(this._api);

  final ApiClient _api;

  Future<Wallpaper> generate(CreateForm form, DeviceProfile? device) async {
    // 1. Try exact match on style and published status
    final list = await _api.getList(
      '/wallpapers',
      query: {
        'select': '*',
        'status': 'eq.published',
        'style': 'eq.${form.style.apiValue}',
        'order': 'created_at.desc',
        'limit': 10,
      },
    );

    if (list.isNotEmpty) {
      final items = list
          .whereType<Map<String, dynamic>>()
          .map(Wallpaper.fromJson)
          .toList();
      items.shuffle();
      return items.first;
    }

    // 2. Fallback to newest published wallpapers
    final fallbackList = await _api.getList(
      '/wallpapers',
      query: {
        'select': '*',
        'status': 'eq.published',
        'order': 'created_at.desc',
        'limit': 5,
      },
    );

    if (fallbackList.isNotEmpty) {
      return Wallpaper.fromJson(fallbackList.first as Map<String, dynamic>);
    }

    throw const AppException(
      AppErrorKind.notFound,
      'No wallpapers available right now.',
    );
  }

  Future<Wallpaper> remix(String wallpaperId, RemixRequest request) async {
    final base = await _api.get(
      '/wallpapers',
      query: {
        'id': 'eq.$wallpaperId',
        'select': '*',
      },
      headers: {
        'Accept': 'application/vnd.pgrst.object+json',
      },
    );
    return Wallpaper.fromJson(base);
  }
}
