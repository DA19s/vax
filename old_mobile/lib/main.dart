import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'core/theme/app_theme.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/onboarding/onboarding_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/pin_login_screen.dart';
import 'screens/auth/create_pin_screen.dart';
import 'screens/dashboard/modern_dashboard_screen.dart';
import 'offline/offline_init.dart';
// ⚠️ On ne met pas LinkChildScreen ici car il est appelé dynamiquement avec des arguments

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await OfflineInit.init();
  await initializeDateFormatting('fr_FR');
  Intl.defaultLocale = 'fr_FR';
  runApp(const VacxCareApp());
}

class VacxCareApp extends StatelessWidget {
  const VacxCareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'VacxCare',
      theme: AppTheme.theme,
      
      // ✅ Configuration locale basique
      locale: const Locale('fr', 'FR'),

      // ✅ Page de démarrage
      initialRoute: '/splash',

      // ✅ Définition des routes (sans LinkChildScreen)
      routes: {
        '/splash': (context) => const SplashScreen(),
        '/onboarding': (context) => const OnboardingScreen(),
        '/login': (context) => const LoginScreen(),
        '/pin-login': (context) => const PinLoginScreen(),
      },
      
      // ✅ Gestion des routes avec arguments
      onGenerateRoute: (settings) {
        if (settings.name == '/dashboard') {
          final args = settings.arguments as Map<String, dynamic>?;
          return MaterialPageRoute(
            builder: (context) => ModernDashboardScreen(
              child: args ?? {
                "id": "test123",
                "name": "Bébé Démo",
                "birthDate": "2024-05-01",
                "gender": "M",
                "status": "À jour",
                "vaccinesDue": ["BCG"],
                "nextAppointment": "2025-10-15",
                "healthCenter": "Poste Santé Tivaouane",
                "region": "Dakar",
              },
            ),
          );
        }
        if (settings.name == '/create-pin') {
          final args = settings.arguments as Map<String, dynamic>?;
          if (args != null) {
            return MaterialPageRoute(
              builder: (context) => CreatePinScreen(
                token: args['token'] as String,
                userData: args['userData'] as Map<String, dynamic>,
              ),
            );
          }
        }
        return null;
      },
    );
  }
}