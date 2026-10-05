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
      baseUrl: '${config.supabaseUrl}/rest/v1',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 60),
      headers: {
        'apikey': config.supabaseAnonKey,
        'Authorization': 'Bearer ${config.supabaseAnonKey}',
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

/// HTTP layer for direct Supabase PostgREST & Cloudflare CDN interactions.
class ApiClient {
  ApiClient(this._dio);

  final Dio _dio;

  Future<List<dynamic>> getList(
    String path, {
    Map<String, Object?>? query,
    Map<String, String>? headers,
  }) async {
    final response = await _guard(
      () => _dio.get<dynamic>(
        path,
        queryParameters: _clean(query),
        options: headers != null ? Options(headers: headers) : null,
      ),
    );
    final data = response.data;
    if (data is List) return data;
    return const [];
  }

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, Object?>? query,
    Map<String, String>? headers,
  }) async {
    final response = await _guard(
      () => _dio.get<dynamic>(
        path,
        queryParameters: _clean(query),
        options: headers != null ? Options(headers: headers) : null,
      ),
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data;
    } else if (data is List &&
        data.isNotEmpty &&
        data.first is Map<String, dynamic>) {
      return data.first as Map<String, dynamic>;
    }
    return const {};
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, Object?>? body,
    Map<String, String>? headers,
  }) async {
    final response = await _guard(
      () => _dio.post<dynamic>(
        path,
        data: body,
        options: headers != null ? Options(headers: headers) : null,
      ),
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      return data;
    }
    return const {};
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
