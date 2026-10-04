import 'package:dotscape_app/core/ads/ads_service.dart';
import 'package:dotscape_app/core/identity/install_id.dart';
import 'package:dotscape_app/shared/models/feed.dart';
import 'package:dotscape_app/shared/models/wallpaper.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Wallpaper', () {
    test('parses API JSON with safe defaults', () {
      final wallpaper = Wallpaper.fromJson({
        'id': 'abc',
        'title': 'Liquid Bloom',
        'thumbnailUrl': 't',
        'previewUrl': 'p',
        'fullUrl': 'f',
        'colors': ['purple', 1],
      });
      expect(wallpaper.title, 'Liquid Bloom');
      expect(wallpaper.colors, ['purple']);
      expect(wallpaper.remixable, isFalse);
      expect(wallpaper.width, 1080);
    });

    test('round-trips through toJson', () {
      const original = Wallpaper(
        id: 'x',
        title: 'T',
        thumbnailUrl: 't',
        previewUrl: 'p',
        fullUrl: 'f',
        remixable: true,
      );
      final copy = Wallpaper.fromJson(original.toJson());
      expect(copy, original);
      expect(copy.remixable, isTrue);
    });
  });

  test('WallpaperPage.append merges items and keeps the newest cursor', () {
    const a = WallpaperPage(
      items: [
        Wallpaper(
          id: '1',
          title: '',
          thumbnailUrl: '',
          previewUrl: '',
          fullUrl: '',
        ),
      ],
      nextOffset: 24,
    );
    const b = WallpaperPage(
      items: [
        Wallpaper(
          id: '2',
          title: '',
          thumbnailUrl: '',
          previewUrl: '',
          fullUrl: '',
        ),
      ],
    );
    final merged = a.append(b);
    expect(merged.items.map((w) => w.id), ['1', '2']);
    expect(merged.hasMore, isFalse);
  });

  test('generateUuidV4 produces RFC 4122 v4 ids', () {
    final pattern = RegExp(
      r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    );
    expect(pattern.hasMatch(generateUuidV4()), isTrue);
  });

  test('InterstitialPolicy never shows before enough completed flows', () {
    final policy = InterstitialPolicy(
      minFlowsBetween: 3,
      minInterval: Duration.zero,
    );
    final now = DateTime(2026);
    expect(
      [policy.shouldShow(now), policy.shouldShow(now), policy.shouldShow(now)],
      [false, false, true],
    );
  });
}
