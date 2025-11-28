import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_colors.dart';

class BasicDatePicker {
  static Future<DateTime?> show({
    required BuildContext context,
    required DateTime initialDate,
    required DateTime firstDate,
    required DateTime lastDate,
    String? title,
  }) async {
    // Utiliser le DatePicker natif Flutter qui est beaucoup plus facile à naviguer
    return await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
      helpText: title ?? 'Choisir une date',
      cancelText: 'Annuler',
      confirmText: 'Confirmer',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            // Personnalisation des couleurs
            colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: AppColors.primary, // Couleur principale (sélection)
              onPrimary: Colors.white, // Texte sur couleur principale
              surface: Colors.white, // Arrière-plan du picker
              onSurface: AppColors.textPrimary, // Couleur du texte
            ),
            // Style des boutons
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                textStyle: const TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          child: child!,
        );
      },
    );
  }
}

