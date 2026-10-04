import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../app/router/routes.dart';
import '../../app/theme/app_theme.dart';
import '../models/wallpaper.dart';

class WallpaperCard extends StatelessWidget {
  const WallpaperCard({super.key, required this.wallpaper, this.radius = 14});

  final Wallpaper wallpaper;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Wallpaper ${wallpaper.title}',
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: Stack(
          fit: StackFit.expand,
          children: [
            CachedNetworkImage(
              imageUrl: wallpaper.thumbnailUrl,
              fit: BoxFit.cover,
              fadeInDuration: const Duration(milliseconds: 200),
              placeholder: (context, url) =>
                  const ColoredBox(color: AppColors.surfaceHigh),
              errorWidget: (context, url, error) => const ColoredBox(
                color: AppColors.surfaceHigh,
                child: Icon(
                  Icons.broken_image_outlined,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            Material(
              type: MaterialType.transparency,
              child: InkWell(
                onTap: () => context.push(
                  Routes.wallpaper(wallpaper.id),
                  extra: wallpaper,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
