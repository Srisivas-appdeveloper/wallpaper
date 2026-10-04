import 'package:flutter/material.dart';

import '../../app/theme/app_theme.dart';
import '../models/choices.dart';

class OptionChips<T extends LabeledOption> extends StatelessWidget {
  const OptionChips({
    super.key,
    required this.options,
    required this.selected,
    required this.onSelected,
  });

  final List<T> options;
  final T? selected;
  final ValueChanged<T> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final option in options)
          ChoiceChip(
            label: Text(option.label),
            selected: option == selected,
            onSelected: (_) => onSelected(option),
          ),
      ],
    );
  }
}

class ColorSwatches extends StatelessWidget {
  const ColorSwatches({
    super.key,
    required this.selected,
    required this.onSelected,
  });

  final ColorChoice? selected;
  final ValueChanged<ColorChoice> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        for (final color in ColorChoice.values)
          Semantics(
            button: true,
            selected: color == selected,
            label: color.label,
            child: InkResponse(
              onTap: () => onSelected(color),
              radius: 24,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.color,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: color == selected
                        ? AppColors.textPrimary
                        : AppColors.outline,
                    width: color == selected ? 3 : 1,
                  ),
                ),
                child: color == selected
                    ? const Icon(Icons.check, size: 18, color: Colors.black)
                    : null,
              ),
            ),
          ),
      ],
    );
  }
}
