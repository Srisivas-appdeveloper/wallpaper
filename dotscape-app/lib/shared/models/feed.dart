import 'package:flutter/foundation.dart';

import 'wallpaper.dart';

List<Wallpaper> _wallpapers(Object? value) => value is List
    ? value
          .whereType<Map<String, dynamic>>()
          .map(Wallpaper.fromJson)
          .toList(growable: false)
    : const [];

@immutable
class FeedSection {
  const FeedSection({
    required this.id,
    required this.title,
    required this.items,
  });

  factory FeedSection.fromJson(Map<String, dynamic> json) => FeedSection(
    id: json['id'] as String? ?? '',
    title: json['title'] as String? ?? '',
    items: _wallpapers(json['items']),
  );

  final String id;
  final String title;
  final List<Wallpaper> items;
}

@immutable
class HomeFeed {
  const HomeFeed({
    required this.hero,
    required this.sections,
    this.isFromCache = false,
  });

  factory HomeFeed.fromJson(
    Map<String, dynamic> json, {
    bool isFromCache = false,
  }) {
    final hero = json['hero'];
    final sections = json['sections'];
    return HomeFeed(
      hero: hero is Map<String, dynamic> ? Wallpaper.fromJson(hero) : null,
      sections: sections is List
          ? sections
                .whereType<Map<String, dynamic>>()
                .map(FeedSection.fromJson)
                .toList(growable: false)
          : const [],
      isFromCache: isFromCache,
    );
  }

  final Wallpaper? hero;
  final List<FeedSection> sections;
  final bool isFromCache;
}

@immutable
class WallpaperPage {
  const WallpaperPage({required this.items, this.nextOffset});

  factory WallpaperPage.fromJson(Map<String, dynamic> json) => WallpaperPage(
    items: _wallpapers(json['items']),
    nextOffset: (json['nextOffset'] as num?)?.toInt(),
  );

  final List<Wallpaper> items;
  final int? nextOffset;

  bool get hasMore => nextOffset != null;

  WallpaperPage append(WallpaperPage next) => WallpaperPage(
    items: [...items, ...next.items],
    nextOffset: next.nextOffset,
  );
}

@immutable
class WallpaperCategory {
  const WallpaperCategory({
    required this.id,
    required this.name,
    this.wallpaperCount = 0,
  });

  factory WallpaperCategory.fromJson(Map<String, dynamic> json) =>
      WallpaperCategory(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        wallpaperCount: (json['wallpaperCount'] as num?)?.toInt() ?? 0,
      );

  final String id;
  final String name;
  final int wallpaperCount;
}
