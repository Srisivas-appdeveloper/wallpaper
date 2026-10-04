import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../../app/config/app_config.dart';
import '../errors/app_exception.dart';
import '../identity/install_id.dart';

final dioProvider = Provider<Dio>((ref) {
  final config = ref.watch(appConfigProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: config.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 90),
      headers: {
        'x-install-id': ref.watch(installIdProvider),
        'accept': 'application/json',
      },
    ),
  );
  if (config.enableHttpLogs) {
    dio.interceptors.add(
      LogInterceptor(
        requestHeader: false,
        responseHeader: false,
        logPrint: (o) => debugPrint('$o'),
      ),
    );
  }
  return dio;
});

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(dioProvider)),
);

/// Thin HTTP layer: JSON in/out, every failure mapped to [AppException].
class ApiClient {
  ApiClient(this._dio);

  final Dio _dio;

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, Object?>? query,
  }) async {
    final response = await _guard(
      () =>
          _dio.get<Map<String, dynamic>>(path, queryParameters: _clean(query)),
    );
    return response.data ?? const {};
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, Object?>? body,
  }) async {
    final response = await _guard(
      () => _dio.post<Map<String, dynamic>>(path, data: body),
    );
    return response.data ?? const {};
  }

  /// Downloads into the temp directory once and reuses the cached file afterwards.
  Future<File> downloadFile(String url, String fileName) async {
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$fileName');
    if (await file.exists() && await file.length() > 0) return file;
    final partial = File('${file.path}.part');
    await _guard(() => _dio.download(url, partial.path));
    return partial.rename(file.path);
  }

  Map<String, Object?>? _clean(Map<String, Object?>? query) => query == null
      ? null
      : (Map.of(query)..removeWhere((_, value) => value == null));

  Future<T> _guard<T>(Future<T> Function() request) async {
    try {
      return await request();
    } on DioException catch (error) {
      throw AppException.fromDio(error);
    }
  }
}
