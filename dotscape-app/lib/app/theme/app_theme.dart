import 'package:flutter/material.dart';

abstract final class AppColors {
  static const background = Color(0xFF000000);
  static const surface = Color(0xFF0D0D10);
  static const surfaceHigh = Color(0xFF18181D);
  static const outline = Color(0xFF2A2A31);
  static const textPrimary = Color(0xFFF4F4F6);
  static const textSecondary = Color(0xFF9B9BA5);
  static const accent = Color(0xFF8B7CFF);
}

abstract final class AppText {
  static const mono = 'monospace';

  static const label = TextStyle(
    fontFamily: mono,
    fontSize: 12,
    letterSpacing: 2,
    color: AppColors.textSecondary,
  );

  static const display = TextStyle(
    fontFamily: mono,
    fontSize: 34,
    fontWeight: FontWeight.w700,
    letterSpacing: 6,
    color: AppColors.textPrimary,
  );
}

abstract final class AppTheme {
  static ThemeData dark() {
    final scheme =
        ColorScheme.fromSeed(
          seedColor: AppColors.accent,
          brightness: Brightness.dark,
        ).copyWith(
          primary: AppColors.accent,
          surface: AppColors.surface,
          onSurface: AppColors.textPrimary,
          outline: AppColors.outline,
        );
    final base = ThemeData(useMaterial3: true, colorScheme: scheme);

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.background,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.accent.withValues(alpha: 0.18),
        labelTextStyle: WidgetStatePropertyAll(
          base.textTheme.labelSmall?.copyWith(letterSpacing: 1.1),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceHigh,
        selectedColor: AppColors.accent.withValues(alpha: 0.25),
        side: const BorderSide(color: AppColors.outline),
        shape: const StadiumBorder(),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(0, 52),
          shape: const StadiumBorder(),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            letterSpacing: 1,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 52),
          shape: const StadiumBorder(),
          side: const BorderSide(color: AppColors.outline),
          foregroundColor: AppColors.textPrimary,
        ),
      ),
      snackBarTheme: const SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surface,
      ),
    );
  }
}
