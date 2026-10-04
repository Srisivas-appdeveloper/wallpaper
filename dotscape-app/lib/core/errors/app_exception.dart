import 'package:dio/dio.dart';

enum AppErrorKind {
  offline,
  timeout,
  rateLimited,
  notFound,
  validation,
  server,
  platform,
  unknown,
}

/// The only error type the UI ever sees. Messages are always user-safe.
class AppException implements Exception {
  const AppException(this.kind, this.message, {this.code});

  factory AppException.fromDio(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const AppException(
          AppErrorKind.timeout,
          'The connection is slow. Try again.',
        );
      case DioExceptionType.connectionError:
        return const AppException(
          AppErrorKind.offline,
          "You're offline. Showing what's saved on your phone.",
        );
      case DioExceptionType.badResponse:
        return _fromResponse(error.response);
      default:
        return const AppException(
          AppErrorKind.unknown,
          'Something went wrong. Try again.',
        );
    }
  }

  static AppException _fromResponse(Response<dynamic>? response) {
    final status = response?.statusCode ?? 0;
    final data = response?.data;
    String? serverMessage;
    String? code;
    if (data is Map && data['error'] is Map) {
      final error = data['error'] as Map;
      serverMessage = error['message'] as String?;
      code = error['code'] as String?;
    }
    final kind = switch (status) {
      429 => AppErrorKind.rateLimited,
      404 => AppErrorKind.notFound,
      400 || 422 => AppErrorKind.validation,
      _ => AppErrorKind.server,
    };
    final message = status >= 500 || serverMessage == null
        ? 'Our servers are having a moment. Try again shortly.'
        : serverMessage;
    return AppException(kind, message, code: code);
  }

  final AppErrorKind kind;
  final String message;
  final String? code;

  bool get isConnectivity =>
      kind == AppErrorKind.offline || kind == AppErrorKind.timeout;

  @override
  String toString() => 'AppException($kind, $message)';
}

String userMessageOf(Object error) =>
    error is AppException ? error.message : 'Something went wrong. Try again.';
