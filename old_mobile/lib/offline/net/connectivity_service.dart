import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final _controller = StreamController<bool>.broadcast();
  late final StreamSubscription _sub;

  Stream<bool> get onStatus => _controller.stream;

  Future<void> start() async {
    final connectivity = Connectivity();
    final initial = await connectivity.checkConnectivity();
    _controller.add(_isOnline(initial));
    _sub = connectivity.onConnectivityChanged.listen((status) {
      _controller.add(_isOnline(status));
    });
  }

  bool _isOnline(ConnectivityResult r) => r != ConnectivityResult.none;

  Future<void> dispose() async {
    await _sub.cancel();
    await _controller.close();
  }
}
