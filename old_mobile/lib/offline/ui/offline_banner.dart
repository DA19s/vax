import 'package:flutter/material.dart';

class OfflineBanner extends StatelessWidget {
  final bool online;
  const OfflineBanner({super.key, required this.online});

  @override
  Widget build(BuildContext context) {
    if (online) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      color: Colors.orange.shade600,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: const Text(
        'Hors ligne — certaines actions seront synchronisées automatiquement',
        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        textAlign: TextAlign.center,
      ),
    );
  }
}
