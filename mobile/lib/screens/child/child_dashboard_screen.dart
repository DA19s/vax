import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ChildDashboardScreen extends StatelessWidget {
  final Map<String, dynamic> userData;
  final String childId;
  
  const ChildDashboardScreen({
    super.key,
    required this.userData,
    required this.childId,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          "Tableau de bord",
          style: GoogleFonts.poppins(
            color: const Color(0xFF0A1A33),
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.child_care,
                  size: 80,
                  color: const Color(0xFF3B760F).withOpacity(0.5),
                ),
                const SizedBox(height: 24),
                Text(
                  "Interface enfant",
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0A1A33),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  "Cette interface sera construite prochainement",
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: const Color(0xFF64748B),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

