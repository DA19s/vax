import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_button.dart';
import '../dashboard/modern_dashboard_screen.dart';

class PinConfirmationScreen extends StatefulWidget {
  final String originalPin;
  final Map<String, dynamic> child;
  
  const PinConfirmationScreen({
    super.key,
    required this.originalPin,
    required this.child,
  });
  
  @override
  State<PinConfirmationScreen> createState() => _PinConfirmationScreenState();
}

class _PinConfirmationScreenState extends State<PinConfirmationScreen> {
  final List<TextEditingController> _controllers = List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(4, (_) => FocusNode());
  final storage = const FlutterSecureStorage();
  
  String get pin => _controllers.map((c) => c.text).join();
  String? errorMessage;
  bool isLoading = false;
  
  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }
  
  Future<void> _onPinComplete() async {
    if (pin.length == 4) {
      setState(() {
        errorMessage = null;
        isLoading = true;
      });
      
      if (pin == widget.originalPin) {
        HapticFeedback.lightImpact();
        
        try {
          await storage.write(key: 'user_pin', value: pin);
          await storage.write(key: 'child_id', value: widget.child['id'] ?? widget.child['_id']);
          
          if (!mounted) return;
          
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(
              builder: (_) => ModernDashboardScreen(child: widget.child),
            ),
            (route) => false,
          );
        } catch (e) {
          setState(() {
            errorMessage = 'Erreur lors de l\'enregistrement';
            isLoading = false;
          });
        }
      } else {
        HapticFeedback.heavyImpact();
        
        setState(() {
          errorMessage = 'Les codes PIN ne correspondent pas';
          isLoading = false;
        });
        
        for (var controller in _controllers) {
          controller.clear();
        }
        _focusNodes[0].requestFocus();
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            children: [
              const SizedBox(height: AppSpacing.xl),
              
              // Logo dans un cercle avec ombre
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.15),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Image.asset(
                  "assets/images/logo_vacxcare.png",
                  width: 70,
                  height: 70,
                ),
              ),
              
              const SizedBox(height: AppSpacing.lg),
              
              Text(
                'Confirmer le code PIN',
                style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w700),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: AppSpacing.sm),
              
              Text(
                'Saisissez à nouveau votre code PIN\npour le confirmer',
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: AppSpacing.xxl),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(4, (index) {
                  return Container(
                    width: 64,
                    height: 64,
                    margin: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                    child: TextField(
                      controller: _controllers[index],
                      focusNode: _focusNodes[index],
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      maxLength: 1,
                      style: AppTextStyles.h1.copyWith(
                        fontWeight: FontWeight.w700,
                        color: errorMessage != null ? AppColors.error : null,
                      ),
                      decoration: InputDecoration(
                        counterText: '',
                        filled: true,
                        fillColor: AppColors.surface,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          borderSide: BorderSide(
                            color: errorMessage != null ? AppColors.error : AppColors.border,
                            width: 2,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          borderSide: BorderSide(
                            color: errorMessage != null ? AppColors.error : AppColors.border,
                            width: 2,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          borderSide: BorderSide(
                            color: errorMessage != null ? AppColors.error : AppColors.primary,
                            width: 2,
                          ),
                        ),
                      ),
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      onChanged: (value) {
                        setState(() {
                          errorMessage = null;
                        });
                        
                        if (value.isNotEmpty) {
                          if (index < 3) {
                            _focusNodes[index + 1].requestFocus();
                          } else {
                            _focusNodes[index].unfocus();
                            _onPinComplete();
                          }
                        } else if (value.isEmpty && index > 0) {
                          _focusNodes[index - 1].requestFocus();
                        }
                      },
                    ),
                  );
                }),
              ),
              
              const SizedBox(height: AppSpacing.lg),
              
              if (errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.errorLight,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 20),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          errorMessage!,
                          style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const Spacer(),
              
              if (isLoading)
                const CircularProgressIndicator()
              else
                AppButton(
                  text: 'Confirmer',
                  onPressed: pin.length == 4 ? _onPinComplete : null,
                  icon: Icons.check_rounded,
                ),
              
              const SizedBox(height: AppSpacing.md),
            ],
          ),
        ),
      ),
    );
  }
}
