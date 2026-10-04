import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError(
    'sharedPreferencesProvider is overridden in bootstrap()',
  ),
);

final localStoreProvider = Provider<LocalStore>(
  (ref) => LocalStore(ref.watch(sharedPreferencesProvider)),
);

abstract final class StoreKeys {
  static const installId = 'install_id';
  static const onboarded = 'onboarded';
  static const deviceProfile = 'device_profile';
  static const vibe = 'vibe';
  static const favorites = 'favorites';
  static const downloads = 'downloads';
  static const history = 'history';
  static const homeCache = 'home_cache';
}

/// Small typed wrapper around SharedPreferences (favorites, history, caches, preferences).
class LocalStore {
  LocalStore(this._prefs);

  final SharedPreferences _prefs;

  String? readString(String key) => _prefs.getString(key);
  Future<void> writeString(String key, String value) async =>
      _prefs.setString(key, value);

  bool readBool(String key) => _prefs.getBool(key) ?? false;
  Future<void> writeBool(String key, bool value) async =>
      _prefs.setBool(key, value);

  Map<String, dynamic>? readJson(String key) {
    final decoded = _decode(key);
    return decoded is Map<String, dynamic> ? decoded : null;
  }

  Future<void> writeJson(String key, Map<String, dynamic> value) async =>
      _prefs.setString(key, jsonEncode(value));

  List<Map<String, dynamic>> readJsonList(String key) {
    final decoded = _decode(key);
    return decoded is List
        ? decoded.whereType<Map<String, dynamic>>().toList()
        : <Map<String, dynamic>>[];
  }

  Future<void> writeJsonList(
    String key,
    List<Map<String, dynamic>> value,
  ) async => _prefs.setString(key, jsonEncode(value));

  Object? _decode(String key) {
    final raw = _prefs.getString(key);
    if (raw == null) return null;
    try {
      return jsonDecode(raw);
    } on FormatException {
      return null;
    }
  }
}
