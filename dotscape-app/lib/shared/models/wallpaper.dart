import 'package:flutter/foundation.dart';

@immutable
class Wallpaper {
  const Wallpaper({
    required this.id,
    required this.title,
    required this.thumbnailUrl,
    required this.previewUrl,
    required this.fullUrl,
    this.description = '',
    this.categoryId,
    this.style,
    this.mood,
    this.colors = const [],
    this.tags = const [],
    this.deviceIds = const [],
    this.isAmoled = false,
    this.remixable = false,
    this.width = 1080,
    this.height = 2400,
    this.downloadCount = 0,
    this.applyCount = 0,
  });

  factory Wallpaper.fromJson(Map<String, dynamic> json) => Wallpaper(
    id: json['id'] as String,
    title: json['title'] as String? ?? 'Untitled',
    description: json['description'] as String? ?? '',
    categoryId: json['categoryId'] as String?,
    style: json['style'] as String?,
    mood: json['mood'] as String?,
    colors: _strings(json['colors']),
    tags: _strings(json['tags']),
    deviceIds: _strings(json['deviceIds']),
    isAmoled: json['isAmoled'] as bool? ?? false,
    remixable: json['remixable'] as bool? ?? false,
    width: (json['width'] as num?)?.toInt() ?? 1080,
    height: (json['height'] as num?)?.toInt() ?? 2400,
    thumbnailUrl: json['thumbnailUrl'] as String? ?? '',
    previewUrl: json['previewUrl'] as String? ?? '',
    fullUrl: json['fullUrl'] as String? ?? '',
    downloadCount: (json['downloadCount'] as num?)?.toInt() ?? 0,
    applyCount: (json['applyCount'] as num?)?.toInt() ?? 0,
  );

  final String id;
  final String title;
  final String description;
  final String? categoryId;
  final String? style;
  final String? mood;
  final List<String> colors;
  final List<String> tags;
  final List<String> deviceIds;
  final bool isAmoled;
  final bool remixable;
  final int width;
  final int height;
  final String thumbnailUrl;
  final String previewUrl;
  final String fullUrl;
  final int downloadCount;
  final int applyCount;

  double get aspectRatio => width / height;

  bool isMadeFor(String? deviceId) =>
      deviceId != null && deviceIds.contains(deviceId);

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'categoryId': categoryId,
    'style': style,
    'mood': mood,
    'colors': colors,
    'tags': tags,
    'deviceIds': deviceIds,
    'isAmoled': isAmoled,
    'remixable': remixable,
    'width': width,
    'height': height,
    'thumbnailUrl': thumbnailUrl,
    'previewUrl': previewUrl,
    'fullUrl': fullUrl,
    'downloadCount': downloadCount,
    'applyCount': applyCount,
  };

  @override
  bool operator ==(Object other) => other is Wallpaper && other.id == id;

  @override
  int get hashCode => id.hashCode;
}

List<String> _strings(Object? value) => value is List
    ? value.whereType<String>().toList(growable: false)
    : const [];
