class SystemSettings {
  final String appName;
  final String? appSubtitle;
  final String? logoUrl;
  final String? primaryColor;
  final String? mobileBackgroundColor;
  final String? mobileButtonColor;
  
  // Onboarding Slide 1
  final String? onboardingSlide1Image;
  final String? onboardingSlide1Title;
  final String? onboardingSlide1Subtitle;
  
  // Onboarding Slide 2
  final String? onboardingSlide2Image;
  final String? onboardingSlide2Title;
  final String? onboardingSlide2Subtitle;
  
  // Onboarding Slide 3
  final String? onboardingSlide3Image;
  final String? onboardingSlide3Title;
  final String? onboardingSlide3Subtitle;
  
  // Dashboard Slide 1
  final String? dashboardSlide1Image;
  final String? dashboardSlide1Title;
  final String? dashboardSlide1Subtitle;
  
  // Dashboard Slide 2
  final String? dashboardSlide2Image;
  final String? dashboardSlide2Title;
  final String? dashboardSlide2Subtitle;
  
  // Dashboard Slide 3
  final String? dashboardSlide3Image;
  final String? dashboardSlide3Title;
  final String? dashboardSlide3Subtitle;

  SystemSettings({
    required this.appName,
    this.appSubtitle,
    this.logoUrl,
    this.primaryColor,
    this.mobileBackgroundColor,
    this.mobileButtonColor,
    this.onboardingSlide1Image,
    this.onboardingSlide1Title,
    this.onboardingSlide1Subtitle,
    this.onboardingSlide2Image,
    this.onboardingSlide2Title,
    this.onboardingSlide2Subtitle,
    this.onboardingSlide3Image,
    this.onboardingSlide3Title,
    this.onboardingSlide3Subtitle,
    this.dashboardSlide1Image,
    this.dashboardSlide1Title,
    this.dashboardSlide1Subtitle,
    this.dashboardSlide2Image,
    this.dashboardSlide2Title,
    this.dashboardSlide2Subtitle,
    this.dashboardSlide3Image,
    this.dashboardSlide3Title,
    this.dashboardSlide3Subtitle,
  });

  factory SystemSettings.fromJson(Map<String, dynamic> json) {
    return SystemSettings(
      appName: json['appName'] ?? 'VaxCare',
      appSubtitle: json['appSubtitle'] ?? 'Santé de votre enfant simplifiée',
      logoUrl: json['logoUrl'],
      primaryColor: json['primaryColor'],
      mobileBackgroundColor: json['mobileBackgroundColor'] ?? '#0A1A33',
      mobileButtonColor: json['mobileButtonColor'] ?? '#3B760F',
      onboardingSlide1Image: json['onboardingSlide1Image'],
      onboardingSlide1Title: json['onboardingSlide1Title'] ?? 'Calendrier vaccinal simplifié',
      onboardingSlide1Subtitle: json['onboardingSlide1Subtitle'] ?? 'Consultez tous les rendez-vous de vaccination de vos enfants en un seul endroit.',
      onboardingSlide2Image: json['onboardingSlide2Image'],
      onboardingSlide2Title: json['onboardingSlide2Title'] ?? 'Suivi professionnel et personnalisé',
      onboardingSlide2Subtitle: json['onboardingSlide2Subtitle'] ?? 'Des agents de santé qualifiés pour accompagner chaque étape de la vaccination.',
      onboardingSlide3Image: json['onboardingSlide3Image'],
      onboardingSlide3Title: json['onboardingSlide3Title'] ?? 'Notifications et rappels intelligents',
      onboardingSlide3Subtitle: json['onboardingSlide3Subtitle'] ?? 'Ne manquez plus jamais un vaccin important pour la santé de votre enfant.',
      dashboardSlide1Image: json['dashboardSlide1Image'],
      dashboardSlide1Title: json['dashboardSlide1Title'] ?? 'Suivi Vaccinal Complet',
      dashboardSlide1Subtitle: json['dashboardSlide1Subtitle'] ?? 'Tous les vaccins de votre enfant en un clin d\'œil',
      dashboardSlide2Image: json['dashboardSlide2Image'],
      dashboardSlide2Title: json['dashboardSlide2Title'] ?? 'Rendez-vous à Venir',
      dashboardSlide2Subtitle: json['dashboardSlide2Subtitle'] ?? 'Ne manquez jamais un rendez-vous important',
      dashboardSlide3Image: json['dashboardSlide3Image'],
      dashboardSlide3Title: json['dashboardSlide3Title'] ?? 'Santé de Votre Enfant',
      dashboardSlide3Subtitle: json['dashboardSlide3Subtitle'] ?? 'Suivez la croissance et le développement',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'appName': appName,
      'appSubtitle': appSubtitle,
      'logoUrl': logoUrl,
      'primaryColor': primaryColor,
      'mobileBackgroundColor': mobileBackgroundColor,
      'mobileButtonColor': mobileButtonColor,
      'onboardingSlide1Image': onboardingSlide1Image,
      'onboardingSlide1Title': onboardingSlide1Title,
      'onboardingSlide1Subtitle': onboardingSlide1Subtitle,
      'onboardingSlide2Image': onboardingSlide2Image,
      'onboardingSlide2Title': onboardingSlide2Title,
      'onboardingSlide2Subtitle': onboardingSlide2Subtitle,
      'onboardingSlide3Image': onboardingSlide3Image,
      'onboardingSlide3Title': onboardingSlide3Title,
      'onboardingSlide3Subtitle': onboardingSlide3Subtitle,
      'dashboardSlide1Image': dashboardSlide1Image,
      'dashboardSlide1Title': dashboardSlide1Title,
      'dashboardSlide1Subtitle': dashboardSlide1Subtitle,
      'dashboardSlide2Image': dashboardSlide2Image,
      'dashboardSlide2Title': dashboardSlide2Title,
      'dashboardSlide2Subtitle': dashboardSlide2Subtitle,
      'dashboardSlide3Image': dashboardSlide3Image,
      'dashboardSlide3Title': dashboardSlide3Title,
      'dashboardSlide3Subtitle': dashboardSlide3Subtitle,
    };
  }
}
