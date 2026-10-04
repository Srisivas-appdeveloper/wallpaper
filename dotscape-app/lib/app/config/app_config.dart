import 'package:flutter_riverpod/flutter_riverpod.dart';

enum Flavor { dev, staging, prod }

/// Immutable, flavor-specific configuration injected once in `bootstrap()`.
class AppConfig {
  const AppConfig._({
    required this.flavor,
    required this.appName,
    required this.apiBaseUrl,
  });

  /// Emulator reaches the host machine via 10.0.2.2.
  /// Real device: --dart-define=API_BASE_URL=http://<LAN-IP>:8080
  factory AppConfig.dev() => const AppConfig._(
    flavor: Flavor.dev,
    appName: 'DOTSCAPE Dev',
    apiBaseUrl: String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://10.0.2.2:8080',
    ),
  );

  factory AppConfig.staging() => const AppConfig._(
    flavor: Flavor.staging,
    appName: 'DOTSCAPE Staging',
    apiBaseUrl: String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://staging-api.dotscape.app',
    ),
  );

  factory AppConfig.prod() => const AppConfig._(
    flavor: Flavor.prod,
    appName: 'DOTSCAPE',
    apiBaseUrl: String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'https://api.dotscape.app',
    ),
  );

  final Flavor flavor;
  final String appName;
  final String apiBaseUrl;

  bool get enableHttpLogs => flavor == Flavor.dev;
  bool get showFlavorBanner => flavor != Flavor.prod;
}

final appConfigProvider = Provider<AppConfig>(
  (ref) => throw UnimplementedError(
    'appConfigProvider is overridden in bootstrap()',
  ),
);
