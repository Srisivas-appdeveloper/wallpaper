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

  /// Backend owns the device table (spec §11): never rely on hardcoded model strings in the app.
  Future<DeviceProfile> resolve(DeviceSnapshot snapshot) async {
    final json = await _api.get(
      '/v1/devices/resolve',
      query: snapshot.toQuery(),
    );
    return DeviceProfile.fromJson(json['device'] as Map<String, dynamic>);
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
