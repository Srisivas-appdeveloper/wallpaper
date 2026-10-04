import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/local_store.dart';

/// Anonymous, per-install identifier. No account required (spec principle #3).
final installIdProvider = Provider<String>((ref) {
  final store = ref.watch(localStoreProvider);
  final existing = store.readString(StoreKeys.installId);
  if (existing != null) return existing;
  final created = generateUuidV4();
  store.writeString(StoreKeys.installId, created);
  return created;
});

String generateUuidV4() {
  final random = Random.secure();
  final bytes = List<int>.generate(16, (_) => random.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-'
      '${hex.substring(16, 20)}-${hex.substring(20)}';
}
