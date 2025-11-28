import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';

class AuthService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  
  // Clés de stockage
  static const String _keyToken = 'auth_token';
  static const String _keyPin = 'user_pin';
  static const String _keyUserData = 'user_data';
  static const String _keyIsLoggedIn = 'is_logged_in';
  
  /// Vérifie si l'utilisateur est déjà connecté (a un token et un PIN)
  static Future<bool> isLoggedIn() async {
    try {
      final token = await _storage.read(key: _keyToken);
      final pin = await _storage.read(key: _keyPin);
      final isLogged = await _storage.read(key: _keyIsLoggedIn);
      
      return token != null && 
             token.isNotEmpty && 
             pin != null && 
             pin.isNotEmpty &&
             isLogged == 'true';
    } catch (e) {
      return false;
    }
  }
  
  /// Vérifie si l'utilisateur a un PIN configuré
  static Future<bool> hasPin() async {
    try {
      final pin = await _storage.read(key: _keyPin);
      return pin != null && pin.isNotEmpty;
    } catch (e) {
      return false;
    }
  }
  
  /// Sauvegarde le PIN de l'utilisateur (hashé)
  static Future<void> savePin(String pin) async {
    // Simple encodage en base64 (pour plus de sécurité, utiliser un hash)
    final encoded = base64.encode(utf8.encode(pin));
    await _storage.write(key: _keyPin, value: encoded);
  }
  
  /// Vérifie si le PIN saisi correspond au PIN enregistré
  static Future<bool> verifyPin(String pin) async {
    try {
      final storedPin = await _storage.read(key: _keyPin);
      if (storedPin == null) return false;
      
      final encoded = base64.encode(utf8.encode(pin));
      return encoded == storedPin;
    } catch (e) {
      return false;
    }
  }
  
  /// Sauvegarde le token JWT
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _keyToken, value: token);
  }
  
  /// Récupère le token JWT
  static Future<String?> getToken() async {
    return await _storage.read(key: _keyToken);
  }
  
  /// Sauvegarde les données utilisateur (child info)
  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    final encoded = jsonEncode(userData);
    await _storage.write(key: _keyUserData, value: encoded);
  }
  
  /// Récupère les données utilisateur
  static Future<Map<String, dynamic>?> getUserData() async {
    try {
      final data = await _storage.read(key: _keyUserData);
      if (data == null) return null;
      return jsonDecode(data) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }
  
  /// Marque l'utilisateur comme connecté
  static Future<void> setLoggedIn(bool value) async {
    await _storage.write(key: _keyIsLoggedIn, value: value.toString());
  }
  
  /// Déconnexion complète (supprime toutes les données)
  static Future<void> logout() async {
    await _storage.deleteAll();
  }
  
  /// Réinitialiser seulement le PIN (en cas d'oubli)
  static Future<void> resetPin() async {
    await _storage.delete(key: _keyPin);
  }
  
  /// Sauvegarde complète après première connexion
  static Future<void> saveCompleteAuthData({
    required String token,
    required Map<String, dynamic> userData,
    required String pin,
  }) async {
    await saveToken(token);
    await saveUserData(userData);
    await savePin(pin);
    await setLoggedIn(true);
  }
}
