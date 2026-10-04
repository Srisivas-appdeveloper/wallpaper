import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/analytics/analytics_service.dart';
import 'config/app_config.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

class DotscapeApp extends ConsumerStatefulWidget {
  const DotscapeApp({super.key});

  @override
  ConsumerState<DotscapeApp> createState() => _DotscapeAppState();
}

class _DotscapeAppState extends ConsumerState<DotscapeApp> {
  @override
  void initState() {
    super.initState();
    ref.read(analyticsProvider).track(AnalyticsEvent.appOpen);
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    return MaterialApp.router(
      title: config.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      routerConfig: ref.watch(appRouterProvider),
      builder: (context, child) {
        final content = child ?? const SizedBox.shrink();
        if (!config.showFlavorBanner) return content;
        return Directionality(
          textDirection: TextDirection.ltr,
          child: Banner(
            message: config.flavor.name.toUpperCase(),
            location: BannerLocation.topEnd,
            child: content,
          ),
        );
      },
    );
  }
}
