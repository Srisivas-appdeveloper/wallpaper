import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/device/device_info_service.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/storage/local_store.dart';
import '../../../shared/models/device_profile.dart';
import '../data/device_repository.dart';

/// Device detected on this phone (used during onboarding).
final detectedDeviceProvider = FutureProvider.autoDispose<DeviceProfile>((
  ref,
) async {
  final snapshot = await ref.watch(deviceInfoServiceProvider).read();
  final repository = ref.watch(deviceRepositoryProvider);
  try {
    return await repository.resolve(snapshot);
  } on AppException {
    return repository.offlineFallback(snapshot);
  }
});

/// Device the user confirmed. Persisted locally.
final currentDeviceProvider =
    NotifierProvider<CurrentDeviceController, DeviceProfile?>(
      CurrentDeviceController.new,
    );

class CurrentDeviceController extends Notifier<DeviceProfile?> {
  @override
  DeviceProfile? build() {
    final raw = ref.read(localStoreProvider).readJson(StoreKeys.deviceProfile);
    return raw == null ? null : DeviceProfile.fromJson(raw);
  }

  Future<void> select(DeviceProfile profile) async {
    await ref
        .read(localStoreProvider)
        .writeJson(StoreKeys.deviceProfile, profile.toJson());
    state = profile;
  }
}
