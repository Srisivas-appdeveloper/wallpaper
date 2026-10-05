import 'package:flutter_riverpod/flutter_riverpod.dart';

enum Flavor { dev, staging, prod }

/// Immutable, flavor-specific configuration injected once in `bootstrap()`.
class AppConfig {
  const AppConfig._({
    required this.flavor,
    required this.appName,
    required this.supabaseUrl,
    required this.supabaseAnonKey,
  });

  static const String defaultSupabaseUrl =
      'https://rcegfuwlunoxmeffarhu.supabase.co';
  static const String defaultSupabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZWdmdXdsdW5veG1lZmZhcmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMjYyNzIsImV4cCI6MjEwNjcwMjI3Mn0.ptUeG60E7RbKGnK_CX7eO77exOM6LBHuBiC6eUWF8X4';

  factory AppConfig.dev() => const AppConfig._(
    flavor: Flavor.dev,
    appName: 'DOTSCAPE Dev',
    supabaseUrl: String.fromEnvironment(
      'SUPABASE_URL',
      defaultValue: defaultSupabaseUrl,
    ),
    supabaseAnonKey: String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: defaultSupabaseAnonKey,
    ),
  );

  factory AppConfig.staging() => const AppConfig._(
    flavor: Flavor.staging,
    appName: 'DOTSCAPE Staging',
    supabaseUrl: String.fromEnvironment(
      'SUPABASE_URL',
      defaultValue: defaultSupabaseUrl,
    ),
    supabaseAnonKey: String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: defaultSupabaseAnonKey,
    ),
  );

  factory AppConfig.prod() => const AppConfig._(
    flavor: Flavor.prod,
    appName: 'DOTSCAPE',
    supabaseUrl: String.fromEnvironment(
      'SUPABASE_URL',
      defaultValue: defaultSupabaseUrl,
    ),
    supabaseAnonKey: String.fromEnvironment(
      'SUPABASE_ANON_KEY',
      defaultValue: defaultSupabaseAnonKey,
    ),
  );

  final Flavor flavor;
  final String appName;
  final String supabaseUrl;
  final String supabaseAnonKey;

  String get apiBaseUrl => '$supabaseUrl/rest/v1';

  bool get enableHttpLogs => flavor == Flavor.dev;
  bool get showFlavorBanner => flavor != Flavor.prod;
}

final appConfigProvider = Provider<AppConfig>(
  (ref) => throw UnimplementedError(
    'appConfigProvider is overridden in bootstrap()',
  ),
);
