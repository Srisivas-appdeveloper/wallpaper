import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/storage/local_store.dart';
import '../../features/create/presentation/create_screen.dart';
import '../../features/explore/presentation/explore_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/library/presentation/saved_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/shell/presentation/app_shell.dart';
import '../../features/wallpaper_detail/presentation/wallpaper_detail_screen.dart';
import '../../shared/models/wallpaper.dart';
import 'routes.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final store = ref.read(localStoreProvider);

  final router = GoRouter(
    initialLocation: Routes.home,
    redirect: (context, state) {
      final onboarded = store.readBool(StoreKeys.onboarded);
      final atOnboarding = state.matchedLocation == Routes.onboarding;
      if (!onboarded && !atOnboarding) return Routes.onboarding;
      if (onboarded && atOnboarding) return Routes.home;
      return null;
    },
    routes: [
      GoRoute(
        path: Routes.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(path: Routes.home, builder: (c, s) => const HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.explore,
                builder: (c, s) => const ExploreScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.create,
                builder: (c, s) => const CreateScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.saved,
                builder: (c, s) => const SavedScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: Routes.wallpaperPattern,
        builder: (context, state) {
          final extra = state.extra;
          return WallpaperDetailScreen(
            wallpaperId: state.pathParameters['id']!,
            initial: extra is Wallpaper ? extra : null,
          );
        },
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});
