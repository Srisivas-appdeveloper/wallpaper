import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/device/device_info_service.dart';
import '../../../core/network/api_client.dart';
import '../../../shared/models/device_profile.dart';

final deviceRepositoryProvider = Provider<DeviceRepository>(
  (ref) => DeviceRepository(ref.watch(apiClientProvider)),
);

class DeviceRepository {
  DeviceRepository(this._api);

  final ApiClient _api;

  /// Resolves device profile against Supabase devices table or falls back to snapshot.
  Future<DeviceProfile> resolve(DeviceSnapshot snapshot) async {
    try {
      final list = await _api.getList('/devices', query: {
        'brand': 'ilike.${snapshot.manufacturer}',
        'model': 'ilike.${snapshot.model}',
        'limit': 1,
      });
      if (list.isNotEmpty && list.first is Map<String, dynamic>) {
        return DeviceProfile.fromJson(list.first as Map<String, dynamic>);
      }
    } catch (_) {}
    return offlineFallback(snapshot);
  }

  DeviceProfile offlineFallback(DeviceSnapshot snapshot) => DeviceProfile(
    id: 'android_generic',
    brand: snapshot.manufacturer,
    model: snapshot.model,
    marketingName: snapshot.displayName.isEmpty
        ? 'your phone'
        : snapshot.displayName,
    screenWidth: snapshot.screenWidth,
    screenHeight: snapshot.screenHeight,
    isGeneric: true,
  );
}
