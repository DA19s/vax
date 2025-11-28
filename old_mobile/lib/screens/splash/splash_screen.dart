import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import 'package:google_fonts/google_fonts.dart';
import '../onboarding/onboarding_screen.dart';
import '../auth/pin_login_screen.dart';
import '../../services/auth_service.dart';
import '../../services/settings_service.dart';
import '../../models/system_settings.dart';
import '../dashboard/modern_dashboard_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  SystemSettings? _settings;
  bool _settingsLoaded = false;

  @override
  void initState() {
    super.initState();

    // Animation d’apparition du logo
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );

    _animation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );

    _controller.forward();
    
    // Charger les paramètres système
    _loadSettings();

    // ⏳ Redirection après 5 secondes avec vérification de connexion
    Timer(const Duration(seconds: 5), () async {
      await _checkAuthAndNavigate();
    });
  }

  /// Charge les paramètres système depuis le serveur
  Future<void> _loadSettings() async {
    try {
      final settings = await SettingsService.getSystemSettings();
      if (mounted) {
        setState(() {
          _settings = settings;
          _settingsLoaded = true;
        });
      }
    } catch (e) {
      debugPrint('Erreur chargement settings: $e');
      // Continuer même si le chargement échoue
      if (mounted) {
        setState(() {
          _settingsLoaded = true;
        });
      }
    }
  }

  /// Vérifier si l'utilisateur est connecté et naviguer vers la bonne page
  Future<void> _checkAuthAndNavigate() async {
    if (!mounted) return;

    try {
      final isLoggedIn = await AuthService.isLoggedIn();
      
      if (isLoggedIn) {
        // Utilisateur connecté avec PIN → Aller à l'écran PIN
        final userData = await AuthService.getUserData();
        
        if (userData != null) {
          // Utilisateur connecté avec PIN → Aller à l'écran PIN
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => PinLoginScreen(settings: _settings),
            ),
          );
        } else {
          // Pas de données utilisateur, retour au login
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => OnboardingScreen(settings: _settings)),
          );
        }
      } else {
        // Pas connecté → Aller à l'onboarding
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => OnboardingScreen(settings: _settings)),
        );
      }
    } catch (e) {
      debugPrint("Erreur vérification auth: $e");
      // En cas d'erreur, aller à l'onboarding par sécurité
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => OnboardingScreen(settings: _settings)),
        );
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _getBackgroundColor() {
    if (_settings?.mobileBackgroundColor != null) {
      try {
        final colorStr = _settings!.mobileBackgroundColor!.replaceAll('#', '');
        return Color(int.parse('FF$colorStr', radix: 16));
      } catch (e) {
        return const Color(0xFF0A1A33);
      }
    }
    return const Color(0xFF0A1A33);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _getBackgroundColor(),
      body: Stack(
        children: [
          // ✅ LOGO + TITRE remontés
          Align(
            alignment: const Alignment(0, -0.15), // Remonté vers le haut
            child: ScaleTransition(
              scale: _animation,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Logo dans un cercle avec ombre - AGRANDI
                  Container(
                    padding: const EdgeInsets.all(35),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.white.withOpacity(0.2),
                          blurRadius: 40,
                          spreadRadius: 10,
                        ),
                      ],
                    ),
                    child: _settings?.logoUrl != null
                        ? CachedNetworkImage(
                            imageUrl: _settings!.logoUrl!,
                            width: 140,
                            height: 140,
                            fit: BoxFit.contain,
                            placeholder: (context, url) => const CircularProgressIndicator(),
                            errorWidget: (context, url, error) => Image.asset(
                              'assets/images/logo_vacxcare.png',
                              width: 140,
                              height: 140,
                            ),
                          )
                        : Image.asset(
                            'assets/images/logo_vacxcare.png',
                            width: 140,
                            height: 140,
                          ),
                  ),

                  const SizedBox(height: 28),

                  // Titre
                  Text(
                    _settings?.appName ?? "VaxCare",
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 42,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Sous-titre
                  Text(
                    _settings?.appSubtitle ?? "Santé de votre enfant simplifiée",
                    style: GoogleFonts.poppins(
                      color: Colors.white.withOpacity(0.85),
                      fontSize: 16,
                      fontWeight: FontWeight.w400,
                      letterSpacing: 0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),

          // ✅ Indicateur de chargement + Texte "Powered by Africanity Group" en bas
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Column(
              children: [
                // Indicateur de chargement
                Container(
                  width: 40,
                  height: 40,
                  margin: const EdgeInsets.only(bottom: 20),
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Colors.white.withOpacity(0.8),
                    ),
                    strokeWidth: 3,
                  ),
                ),

                Text(
                  "Powered by",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 13,
                    fontWeight: FontWeight.w300,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "Africanity Group",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ✅ Painter pour créer un motif médical en arrière-plan
class MedicalPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    // Dessiner quelques croix médicales stylisées
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 5; j++) {
        final x = (i + 0.5) * size.width / 5;
        final y = (j + 0.5) * size.height / 5;
        
        // Croix horizontale
        canvas.drawLine(
          Offset(x - 15, y),
          Offset(x + 15, y),
          paint,
        );
        
        // Croix verticale
        canvas.drawLine(
          Offset(x, y - 15),
          Offset(x, y + 15),
          paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}