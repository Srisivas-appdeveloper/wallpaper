import 'package:flutter/material.dart';

import '../models/wallpaper.dart';
import 'wallpaper_card.dart';

class WallpaperGridSliver extends StatelessWidget {
  const WallpaperGridSliver({super.key, required this.items});

  final List<Wallpaper> items;

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      sliver: SliverGrid.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 9 / 19.5,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) => WallpaperCard(wallpaper: items[index]),
      ),
    );
  }
}
