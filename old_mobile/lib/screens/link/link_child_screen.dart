import 'package:flutter/material.dart';
import '../auth/pin_creation_screen.dart';

class LinkChildScreen extends StatelessWidget {
  final Map<String, dynamic> child;

  const LinkChildScreen({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final name = (child['name'] ?? 'Cet enfant').toString();
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'Lier un carnet',
          style: TextStyle(color: Color(0xFF0A1A33), fontWeight: FontWeight.w700),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF0A1A33)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 12),
              Image.asset(
                'assets/images/onboarding1.png',
                height: 220,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 24),
              Text(
                "Voulez-vous lier ce compte avec le carnet de $name ?",
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0A1A33),
                ),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PinCreationScreen(child: child),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0A1A33),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text(
                    'Oui, lier le carnet',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF0A1A33), width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text(
                    'Non, plus tard',
                    style: TextStyle(color: Color(0xFF0A1A33), fontSize: 16),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                "Vous pourrez toujours lier un enfant plus tard depuis votre tableau de bord.",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.black54),
              ),
            ],
          ),
        ),
      ),
    );
  }
}