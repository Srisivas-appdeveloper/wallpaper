import 'package:flutter/material.dart';

/// Anything that can be shown as a selectable chip.
abstract interface class LabeledOption {
  String get label;
}

enum ColorChoice implements LabeledOption {
  purple('purple', 'Purple', Color(0xFF8B7CFF)),
  blue('blue', 'Blue', Color(0xFF3D7BFF)),
  cyan('cyan', 'Cyan', Color(0xFF5CE1E6)),
  green('green', 'Green', Color(0xFF3DDC97)),
  lime('lime', 'Lime', Color(0xFFD4FF4F)),
  orange('orange', 'Orange', Color(0xFFFF8A3D)),
  red('red', 'Red', Color(0xFFFF4D4D)),
  pink('pink', 'Pink', Color(0xFFFF78D2)),
  white('white', 'White', Color(0xFFF2F2F2));

  const ColorChoice(this.apiValue, this.label, this.color);

  final String apiValue;
  @override
  final String label;
  final Color color;
}

enum StyleChoice implements LabeledOption {
  liquid('liquid', 'Liquid'),
  aurora('aurora', 'Aurora'),
  minimal('minimal', 'Minimal'),
  dots('dots', 'Dot Matrix'),
  cyber('cyber', 'Cyber');

  const StyleChoice(this.apiValue, this.label);

  final String apiValue;
  @override
  final String label;

  static StyleChoice fromApi(String? value) => values.firstWhere(
    (s) => s.apiValue == value,
    orElse: () => StyleChoice.liquid,
  );
}

enum MoodChoice implements LabeledOption {
  calm('Calm'),
  focus('Focus'),
  energy('Energy'),
  dream('Dream'),
  night('Night'),
  weird('Weird');

  const MoodChoice(this.label);

  @override
  final String label;
  String get apiValue => name;
}

enum RemixOperation implements LabeledOption {
  newComposition('new_composition', 'New layout'),
  newColors('new_colors', 'Surprise colors'),
  darker('darker', 'Darker'),
  brighter('brighter', 'Brighter'),
  amoled('amoled', 'AMOLED'),
  moreMinimal('more_minimal', 'More minimal'),
  moreDetail('more_detail', 'More detail');

  const RemixOperation(this.apiValue, this.label);

  final String apiValue;
  @override
  final String label;
}

enum ReportReason implements LabeledOption {
  copyright('copyright', 'Copyright issue'),
  inappropriate('inappropriate', 'Inappropriate content'),
  lowQuality('low_quality', 'Low quality'),
  other('other', 'Something else');

  const ReportReason(this.apiValue, this.label);

  final String apiValue;
  @override
  final String label;
}
