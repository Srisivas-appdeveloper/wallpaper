import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../errors/app_exception.dart';
import '../network/api_client.dart';

abstract final class FeatureFlags {
  static const aiGeneration = 'ai_generation';
  static const remix = 'remix';
}

class RemoteConfig {
  const RemoteConfig({required this.flags, required this.dailyGenerations});

  factory RemoteConfig.fromJson(Map<String, dynamic> json) {
    final rawFlags = json['flags'];
    final limits = json['limits'];
    return RemoteConfig(
      flags: rawFlags is Map
          ? {
              for (final e in rawFlags.entries)
                e.key.toString(): e.value == true,
            }
          : const {},
      dailyGenerations: limits is Map
          ? (limits['dailyGenerations'] as num?)?.toInt() ?? 15
          : 15,
    );
  }

  static const fallback = RemoteConfig(flags: {}, dailyGenerations: 15);

  final Map<String, bool> flags;
  final int dailyGenerations;

  bool isEnabled(String key, {bool fallback = true}) => flags[key] ?? fallback;
}

final remoteConfigProvider = FutureProvider<RemoteConfig>((ref) async {
  try {
    return RemoteConfig.fromJson(
      await ref.watch(apiClientProvider).get('/v1/config'),
    );
  } on AppException {
    return RemoteConfig.fallback;
  }
});
