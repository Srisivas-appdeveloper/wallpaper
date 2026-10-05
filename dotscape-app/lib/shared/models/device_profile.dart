import 'package:flutter/foundation.dart';

@immutable
class DeviceProfile {
  const DeviceProfile({
    required this.id,
    required this.brand,
    required this.model,
    required this.marketingName,
    required this.screenWidth,
    required this.screenHeight,
    this.safeTop = 0.1,
    this.safeBottom = 0.08,
    this.supportsGlyph = false,
    this.isGeneric = false,
  });

  factory DeviceProfile.fromJson(Map<String, dynamic> json) => DeviceProfile(
    id: json['id'] as String,
    brand: json['brand'] as String? ?? '',
    model: json['model'] as String? ?? '',
    marketingName:
        (json['marketingName'] ?? json['marketing_name']) as String? ??
        'your phone',
    screenWidth:
        ((json['screenWidth'] ?? json['screen_width']) as num?)?.toInt() ??
        1080,
    screenHeight:
        ((json['screenHeight'] ?? json['screen_height']) as num?)?.toInt() ??
        2400,
    safeTop:
        ((json['safeTop'] ?? json['safe_top']) as num?)?.toDouble() ?? 0.1,
    safeBottom:
        ((json['safeBottom'] ?? json['safe_bottom']) as num?)?.toDouble() ??
        0.08,
    supportsGlyph:
        (json['supportsGlyph'] ?? json['supports_glyph']) as bool? ?? false,
    isGeneric: (json['isGeneric'] ?? json['is_generic']) as bool? ?? false,
  );

  final String id;
  final String brand;
  final String model;
  final String marketingName;
  final int screenWidth;
  final int screenHeight;
  final double safeTop;
  final double safeBottom;
  final bool supportsGlyph;
  final bool isGeneric;

  Map<String, dynamic> toJson() => {
    'id': id,
    'brand': brand,
    'model': model,
    'marketingName': marketingName,
    'screenWidth': screenWidth,
    'screenHeight': screenHeight,
    'safeTop': safeTop,
    'safeBottom': safeBottom,
    'supportsGlyph': supportsGlyph,
    'isGeneric': isGeneric,
  };
}
