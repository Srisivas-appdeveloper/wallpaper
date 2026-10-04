import 'package:flutter/material.dart';

import '../../core/errors/app_exception.dart';

/// Runs [task] behind a blocking progress dialog and reports the outcome with a SnackBar.
/// Returns the task result, or null on failure.
Future<T?> runWithProgress<T>(
  BuildContext context,
  Future<T> Function() task, {
  String label = 'Working…',
  String? successMessage,
}) async {
  final navigator = Navigator.of(context, rootNavigator: true);
  final messenger = ScaffoldMessenger.of(context);

  showDialog<void>(
    context: context,
    useRootNavigator: true,
    barrierDismissible: false,
    builder: (_) => PopScope(
      canPop: false,
      child: Center(
        child: Card(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 22),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                const SizedBox(width: 16),
                Text(label),
              ],
            ),
          ),
        ),
      ),
    ),
  );

  try {
    final result = await task();
    navigator.pop();
    if (successMessage != null)
      messenger.showSnackBar(SnackBar(content: Text(successMessage)));
    return result;
  } on Object catch (error) {
    navigator.pop();
    messenger.showSnackBar(SnackBar(content: Text(userMessageOf(error))));
    return null;
  }
}
