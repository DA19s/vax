import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Script de debug pour effacer le storage
/// Usage: Appeler clearStorageDebug() depuis n'importe où dans l'app
Future<void> clearStorageDebug() async {
  const storage = FlutterSecureStorage();
  await storage.deleteAll();
  debugPrint('✅ Storage effacé - Veuillez vous reconnecter');
}
