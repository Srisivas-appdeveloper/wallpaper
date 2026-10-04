import 'dart:io';
import 'dart:math' as math;

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final deviceInfoServiceProvider = Provider<DeviceInfoService>(
  (ref) => DeviceInfoService(),
);

@immutable
class DeviceSnapshot {
  const DeviceSnapshot({
    required this.manufacturer,
    required this.model,
    required this.sdkInt,
    required this.screenWidth,
    required this.screenHeight,
  });

  final String manufacturer;
  final String model;
  final int sdkInt;
  final int screenWidth;
  final int screenHeight;

  String get displayName => '$manufacturer $model'.trim();

  Map<String, Object?> toQuery() => {
    'manufacturer': manufacturer,
    'model': model,
    'screenWidth': screenWidth,
    'screenHeight': screenHeight,
  };
}

class DeviceInfoService {
  Future<DeviceSnapshot> read() async {
    final view = WidgetsBinding.instance.platformDispatcher.views.first;
    final size = view.physicalSize;
    final width = math.min(size.width, size.height).round();
    final height = math.max(size.width, size.height).round();

    if (!Platform.isAndroid) {
      return DeviceSnapshot(
        manufacturer: 'unknown',
        model: 'unknown',
        sdkInt: 0,
        screenWidth: width,
        screenHeight: height,
      );
    }
    final info = await DeviceInfoPlugin().androidInfo;
    return DeviceSnapshot(
      manufacturer: info.manufacturer,
      model: info.model,
      sdkInt: info.version.sdkInt,
      screenWidth: width,
      screenHeight: height,
    );
  }
}
