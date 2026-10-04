import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/models/feed.dart';
import '../../device/application/device_providers.dart';
import '../data/home_repository.dart';

final homeFeedProvider = FutureProvider.autoDispose<HomeFeed>((ref) {
  final deviceId = ref.watch(
    currentDeviceProvider.select((device) => device?.id),
  );
  return ref.watch(homeRepositoryProvider).fetch(deviceId: deviceId);
});
