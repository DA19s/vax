import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';

/// Types d'erreurs pour lesquelles on peut faire un retry
enum RetryableErrorType {
  network,
  timeout,
  server,
  unknown
}

/// Configuration du retry
class RetryConfig {
  final int maxAttempts;
  final Duration initialDelay;
  final Duration maxDelay;
  final double backoffMultiplier;
  final bool useJitter;
  final List<RetryableErrorType> retryableErrors;

  const RetryConfig({
    this.maxAttempts = 3,
    this.initialDelay = const Duration(seconds: 1),
    this.maxDelay = const Duration(seconds: 30),
    this.backoffMultiplier = 2.0,
    this.useJitter = true,
    this.retryableErrors = const [
      RetryableErrorType.network,
      RetryableErrorType.timeout,
      RetryableErrorType.server,
    ],
  });

  /// Configuration pour les requêtes API
  static const api = RetryConfig(
    maxAttempts: 3,
    initialDelay: Duration(milliseconds: 500),
    maxDelay: Duration(seconds: 10),
    backoffMultiplier: 2.0,
    useJitter: true,
  );

  /// Configuration pour les opérations critiques
  static const critical = RetryConfig(
    maxAttempts: 5,
    initialDelay: Duration(seconds: 1),
    maxDelay: Duration(seconds: 30),
    backoffMultiplier: 1.5,
    useJitter: true,
  );

  /// Configuration pour les opérations rapides
  static const fast = RetryConfig(
    maxAttempts: 2,
    initialDelay: Duration(milliseconds: 200),
    maxDelay: Duration(seconds: 2),
    backoffMultiplier: 2.0,
    useJitter: false,
  );
}

/// Résultat d'une tentative de retry
class RetryResult<T> {
  final T? data;
  final Exception? error;
  final int attempts;
  final Duration totalDuration;
  final bool isSuccess;

  const RetryResult({
    this.data,
    this.error,
    required this.attempts,
    required this.totalDuration,
    required this.isSuccess,
  });
}

/// Helper pour les opérations avec retry automatique
class RetryHelper {
  static final Random _random = Random();

  /// Exécuter une fonction avec retry automatique
  static Future<RetryResult<T>> execute<T>(
    Future<T> Function() operation, {
    RetryConfig config = RetryConfig.api,
    String? operationName,
  }) async {
    final startTime = DateTime.now();
    Exception? lastError;
    
    for (int attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        if (kDebugMode && operationName != null) {
          print('🔄 Tentative $attempt/${config.maxAttempts} pour $operationName');
        }
        
        final result = await operation();
        final duration = DateTime.now().difference(startTime);
        
        if (kDebugMode && operationName != null && attempt > 1) {
          print('✅ $operationName réussi après $attempt tentatives');
        }
        
        return RetryResult<T>(
          data: result,
          attempts: attempt,
          totalDuration: duration,
          isSuccess: true,
        );
      } catch (error) {
        lastError = error is Exception ? error : Exception(error.toString());
        
        // Vérifier si l'erreur est retryable
        if (!_isRetryableError(lastError, config.retryableErrors)) {
          if (kDebugMode && operationName != null) {
            print('❌ $operationName échoué avec erreur non-retryable: $error');
          }
          break;
        }
        
        // Si c'est la dernière tentative, ne pas attendre
        if (attempt == config.maxAttempts) {
          if (kDebugMode && operationName != null) {
            print('❌ $operationName échoué après $attempt tentatives: $error');
          }
          break;
        }
        
        // Calculer le délai avant la prochaine tentative
        final delay = _calculateDelay(attempt, config);
        
        if (kDebugMode && operationName != null) {
          print('⏳ $operationName échoué (tentative $attempt), retry dans ${delay.inMilliseconds}ms: $error');
        }
        
        await Future.delayed(delay);
      }
    }
    
    final duration = DateTime.now().difference(startTime);
    return RetryResult<T>(
      error: lastError,
      attempts: config.maxAttempts,
      totalDuration: duration,
      isSuccess: false,
    );
  }

  /// Wrapper pour les requêtes HTTP
  static Future<RetryResult<T>> httpRequest<T>(
    Future<T> Function() request, {
    String? url,
    RetryConfig config = RetryConfig.api,
  }) async {
    return execute(
      request,
      config: config,
      operationName: url != null ? 'HTTP Request to $url' : 'HTTP Request',
    );
  }

  /// Wrapper pour les opérations de base de données locale
  static Future<RetryResult<T>> databaseOperation<T>(
    Future<T> Function() operation, {
    String? operationName,
    RetryConfig config = RetryConfig.fast,
  }) async {
    return execute(
      operation,
      config: config,
      operationName: operationName ?? 'Database Operation',
    );
  }

  /// Wrapper pour les opérations de cache
  static Future<RetryResult<T>> cacheOperation<T>(
    Future<T> Function() operation, {
    String? operationName,
    RetryConfig config = RetryConfig.fast,
  }) async {
    return execute(
      operation,
      config: config,
      operationName: operationName ?? 'Cache Operation',
    );
  }

  /// Vérifier si une erreur est retryable
  static bool _isRetryableError(Exception error, List<RetryableErrorType> retryableErrors) {
    final errorType = _classifyError(error);
    return retryableErrors.contains(errorType);
  }

  /// Classifier le type d'erreur
  static RetryableErrorType _classifyError(Exception error) {
    final errorString = error.toString().toLowerCase();
    
    // Erreurs réseau
    if (error is SocketException ||
        errorString.contains('network') ||
        errorString.contains('connection') ||
        errorString.contains('unreachable') ||
        errorString.contains('no internet') ||
        errorString.contains('connection refused') ||
        errorString.contains('connection reset')) {
      return RetryableErrorType.network;
    }
    
    // Erreurs de timeout
    if (error is TimeoutException ||
        errorString.contains('timeout') ||
        errorString.contains('deadline exceeded')) {
      return RetryableErrorType.timeout;
    }
    
    // Erreurs serveur (5xx)
    if (errorString.contains('500') ||
        errorString.contains('502') ||
        errorString.contains('503') ||
        errorString.contains('504') ||
        errorString.contains('server error') ||
        errorString.contains('internal server error') ||
        errorString.contains('bad gateway') ||
        errorString.contains('service unavailable') ||
        errorString.contains('gateway timeout')) {
      return RetryableErrorType.server;
    }
    
    return RetryableErrorType.unknown;
  }

  /// Calculer le délai avant la prochaine tentative
  static Duration _calculateDelay(int attempt, RetryConfig config) {
    // Calcul du backoff exponentiel
    final baseDelay = config.initialDelay.inMilliseconds;
    final exponentialDelay = baseDelay * pow(config.backoffMultiplier, attempt - 1);
    
    // Limiter au délai maximum
    final cappedDelay = min(exponentialDelay, config.maxDelay.inMilliseconds.toDouble());
    
    // Ajouter du jitter si activé
    final finalDelay = config.useJitter 
        ? cappedDelay * (0.5 + _random.nextDouble() * 0.5) // Jitter entre 50% et 100%
        : cappedDelay;
    
    return Duration(milliseconds: finalDelay.round());
  }
}

/// Extension pour faciliter l'utilisation du retry
extension RetryExtension<T> on Future<T> {
  /// Ajouter un retry automatique à n'importe quel Future
  Future<RetryResult<T>> withRetry({
    RetryConfig config = RetryConfig.api,
    String? operationName,
  }) {
    return RetryHelper.execute(() => this, config: config, operationName: operationName);
  }

  /// Retry spécialisé pour les requêtes HTTP
  Future<RetryResult<T>> withHttpRetry({
    String? url,
    RetryConfig config = RetryConfig.api,
  }) {
    return RetryHelper.httpRequest(() => this, url: url, config: config);
  }
}

/// Mixin pour ajouter des capacités de retry aux classes
mixin RetryMixin {
  /// Exécuter une opération avec retry
  Future<RetryResult<T>> retry<T>(
    Future<T> Function() operation, {
    RetryConfig config = RetryConfig.api,
    String? operationName,
  }) {
    return RetryHelper.execute(operation, config: config, operationName: operationName);
  }

  /// Retry pour les requêtes API
  Future<RetryResult<T>> retryApiCall<T>(
    Future<T> Function() apiCall, {
    String? endpoint,
  }) {
    return RetryHelper.httpRequest(
      apiCall,
      url: endpoint,
      config: RetryConfig.api,
    );
  }

  /// Retry pour les opérations critiques
  Future<RetryResult<T>> retryCritical<T>(
    Future<T> Function() operation, {
    String? operationName,
  }) {
    return RetryHelper.execute(
      operation,
      config: RetryConfig.critical,
      operationName: operationName,
    );
  }
}

/// Utilitaires pour gérer les résultats de retry
class RetryUtils {
  /// Extraire la valeur ou lancer l'erreur
  static T unwrap<T>(RetryResult<T> result) {
    if (result.isSuccess && result.data != null) {
      return result.data!;
    }
    throw result.error ?? Exception('Opération échouée après ${result.attempts} tentatives');
  }

  /// Extraire la valeur ou retourner une valeur par défaut
  static T unwrapOr<T>(RetryResult<T> result, T defaultValue) {
    return result.isSuccess && result.data != null ? result.data! : defaultValue;
  }

  /// Vérifier si le résultat est un succès
  static bool isSuccess<T>(RetryResult<T> result) {
    return result.isSuccess && result.data != null;
  }

  /// Obtenir un message d'erreur lisible
  static String getErrorMessage<T>(RetryResult<T> result) {
    if (result.isSuccess) return 'Succès';
    
    final error = result.error?.toString() ?? 'Erreur inconnue';
    return 'Échec après ${result.attempts} tentatives: $error';
  }

  /// Logger les statistiques de retry
  static void logStats<T>(RetryResult<T> result, String operationName) {
    if (kDebugMode) {
      final status = result.isSuccess ? '✅' : '❌';
      final duration = result.totalDuration.inMilliseconds;
      print('$status $operationName: ${result.attempts} tentatives, ${duration}ms');
      
      if (!result.isSuccess && result.error != null) {
        print('   Erreur: ${result.error}');
      }
    }
  }
}
