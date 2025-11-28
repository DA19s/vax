import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';

class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  
  const VideoPlayerWidget({
    super.key,
    required this.videoUrl,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  VideoPlayerController? _videoController;
  YoutubePlayerController? _youtubeController;
  bool _isYouTube = false;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  void _initializePlayer() async {
    try {
      // Vérifier si c'est une vidéo YouTube
      String? videoId = YoutubePlayer.convertUrlToId(widget.videoUrl);
      
      if (videoId != null) {
        // Vidéo YouTube
        setState(() {
          _isYouTube = true;
          _youtubeController = YoutubePlayerController(
            initialVideoId: videoId,
            flags: const YoutubePlayerFlags(
              autoPlay: false,
              mute: false,
              enableCaption: false,
            ),
          );
          _isLoading = false;
        });
      } else {
        // Vidéo directe (MP4, MOV, etc.)
        _videoController = VideoPlayerController.networkUrl(
          Uri.parse(widget.videoUrl),
        );

        await _videoController!.initialize();
        
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Erreur de chargement de la vidéo';
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _youtubeController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        height: 200,
        decoration: BoxDecoration(
          color: AppColors.textTertiary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Container(
        height: 200,
        decoration: BoxDecoration(
          color: AppColors.error.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: AppSpacing.sm),
              Text(
                _error!,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.error,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_isYouTube && _youtubeController != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: YoutubePlayer(
          controller: _youtubeController!,
          showVideoProgressIndicator: true,
          progressIndicatorColor: AppColors.primary,
        ),
      );
    }

    if (_videoController != null && _videoController!.value.isInitialized) {
      return _DirectVideoPlayer(controller: _videoController!);
    }

    return const SizedBox.shrink();
  }
}

// Widget pour les vidéos directes (MP4, MOV, etc.)
class _DirectVideoPlayer extends StatefulWidget {
  final VideoPlayerController controller;

  const _DirectVideoPlayer({required this.controller});

  @override
  State<_DirectVideoPlayer> createState() => _DirectVideoPlayerState();
}

class _DirectVideoPlayerState extends State<_DirectVideoPlayer> {
  bool _showControls = true;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: AspectRatio(
        aspectRatio: widget.controller.value.aspectRatio,
        child: GestureDetector(
          onTap: () {
            setState(() {
              _showControls = !_showControls;
            });
          },
          child: Stack(
            alignment: Alignment.center,
            children: [
              VideoPlayer(widget.controller),
              
              // Overlay avec contrôles
              if (_showControls)
                Container(
                  color: Colors.black26,
                  child: Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Bouton reculer 10s
                        IconButton(
                          icon: const Icon(Icons.replay_10, color: Colors.white, size: 32),
                          onPressed: () {
                            final position = widget.controller.value.position;
                            widget.controller.seekTo(position - const Duration(seconds: 10));
                          },
                        ),
                        const SizedBox(width: AppSpacing.lg),
                        
                        // Bouton play/pause
                        IconButton(
                          icon: Icon(
                            widget.controller.value.isPlaying
                                ? Icons.pause_circle_filled
                                : Icons.play_circle_filled,
                            color: Colors.white,
                            size: 64,
                          ),
                          onPressed: () {
                            setState(() {
                              widget.controller.value.isPlaying
                                  ? widget.controller.pause()
                                  : widget.controller.play();
                            });
                          },
                        ),
                        const SizedBox(width: AppSpacing.lg),
                        
                        // Bouton avancer 10s
                        IconButton(
                          icon: const Icon(Icons.forward_10, color: Colors.white, size: 32),
                          onPressed: () {
                            final position = widget.controller.value.position;
                            widget.controller.seekTo(position + const Duration(seconds: 10));
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              
              // Barre de progression en bas
              if (_showControls)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: VideoProgressIndicator(
                    widget.controller,
                    allowScrubbing: true,
                    colors: const VideoProgressColors(
                      playedColor: AppColors.primary,
                      bufferedColor: Colors.white38,
                      backgroundColor: Colors.white24,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
