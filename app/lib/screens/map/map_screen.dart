import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';

import '../../config/ui_tokens.dart';
import '../../config/workon_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../services/auth/auth_errors.dart';
import '../../services/location/location_service.dart';
import '../../services/missions_map/mission_map_api.dart';
import '../../services/offers/offers_api.dart';
import '../../widgets/wk_badge.dart';

/// Appels de service sur la carte.
/// Données issues de GET /api/v1/missions-map (public).
class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? _mapCtrl;
  UserPosition? _userPos;
  List<MissionPin> _pins = [];
  Set<Marker> _markers = {};
  bool _loading = true;
  String? _error;
  final bool _mapsAvailable = true;
  double _radiusKm = 10;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    // Load missions immediately with default position — do NOT block on GPS.
    await _loadMissions();
    // Fetch GPS in parallel; update camera if it arrives within 4 s.
    _tryGetLocation();
  }

  Future<void> _tryGetLocation() async {
    try {
      final pos = await LocationService.instance
          .getCurrentPosition()
          .timeout(const Duration(seconds: 4));
      if (!mounted) return;
      setState(() => _userPos = pos);
      _mapCtrl?.animateCamera(
        CameraUpdate.newLatLng(LatLng(pos.latitude, pos.longitude)),
      );
    } catch (_) {
      // GPS unavailable or timed out — keep default position silently.
    }
  }

  Future<void> _loadMissions() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });

    final center = _userPos ?? UserPosition.defaultPosition;

    try {
      final pins = await const MissionMapApi().getMissions(
        lat: center.latitude,
        lng: center.longitude,
        radiusKm: _radiusKm,
        status: 'open',
      );
      if (!mounted) return;
      setState(() {
        _pins = pins;
        _markers = pins.map(_buildMarker).toSet();
        _loading = false;
      });
    } on MissionMapApiException catch (e) {
      if (mounted) setState(() { _loading = false; _error = e.message; });
    } catch (e) {
      if (mounted) setState(() { _loading = false; _error = 'Impossible de charger les appels de service.'; });
    }
  }

  Marker _buildMarker(MissionPin pin) {
    return Marker(
      markerId: MarkerId(pin.id),
      position: LatLng(pin.latitude, pin.longitude),
      icon: BitmapDescriptor.defaultMarkerWithHue(
        pin.status == 'open'
            ? BitmapDescriptor.hueOrange  // brand orange for open missions
            : BitmapDescriptor.hueRed,    // red for other statuses
      ),
      infoWindow: InfoWindow(
        title: pin.title,
        snippet: '${pin.price.toInt()} \$',
      ),
      onTap: () => _showMissionDetail(pin),
    );
  }

  void _showMissionDetail(MissionPin pin) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _MissionDetailSheet(pin: pin),
    );
  }

  void _centerOnUser() async {
    if (_mapCtrl == null) return;
    final pos = await LocationService.instance.getCurrentPosition();
    _mapCtrl!.animateCamera(
      CameraUpdate.newLatLng(LatLng(pos.latitude, pos.longitude)),
    );
  }

  void _showFilters() {
    showModalBottomSheet(
      context: context,
      backgroundColor: WkColors.bgSecondary,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _FiltersSheet(
        initialRadius: _radiusKm,
        onApply: (newRadius) {
          setState(() => _radiusKm = newRadius);
          _loadMissions();
        },
      ),
    );
  }

  @override
  void dispose() {
    _mapCtrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: WkColors.bgSecondary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: WkColors.textPrimary, size: 20),
          onPressed: () => context.canPop() ? context.pop() : context.go('/home'),
        ),
        title: const Text(
          'Appels de service',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location, color: WkColors.textPrimary),
            onPressed: _centerOnUser,
          ),
          IconButton(
            icon: const Icon(Icons.tune_outlined, color: WkColors.textPrimary),
            onPressed: _showFilters,
          ),
        ],
      ),
      body: _mapsAvailable ? _buildMap() : _buildFallback(),
    );
  }

  Widget _buildMap() {
    final center = _userPos ?? UserPosition.defaultPosition;
    return Stack(
      children: [
        GoogleMap(
          initialCameraPosition: CameraPosition(
            target: LatLng(center.latitude, center.longitude),
            zoom: 13,
          ),
          onMapCreated: (ctrl) => _mapCtrl = ctrl,
          markers: _markers,
          myLocationEnabled: true,
          myLocationButtonEnabled: false,
          mapType: MapType.normal,
          compassEnabled: false,
          zoomControlsEnabled: false,
        ),
        if (_loading)
          const Center(child: CircularProgressIndicator(color: WkColors.brandRed)),
        if (_error != null)
          _ErrorBanner(message: _error!, onRetry: _loadMissions),
        if (!_loading && _pins.isEmpty && _error == null)
          const _EmptyBanner(),
        if (!_loading && _pins.isNotEmpty)
          Positioned(
            top: 12,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: WkColors.bgSecondary,
                borderRadius: BorderRadius.circular(WkRadius.pill),
                border: Border.all(color: WkColors.bgQuaternary, width: 0.5),
                boxShadow: WkColors.shadowCard,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: WkColors.brandOrange,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${_pins.length} appel${_pins.length > 1 ? 's' : ''} trouvé${_pins.length > 1 ? 's' : ''}',
                    style: const TextStyle(
                      fontFamily: 'General Sans',
                      color: WkColors.textPrimary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildFallback() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            style: const TextStyle(color: WkColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Rechercher un service...',
              hintStyle: const TextStyle(color: WkColors.textTertiary, fontSize: 14),
              prefixIcon: const Icon(Icons.search, color: WkColors.textTertiary),
              filled: true,
              fillColor: WkColors.bgSecondary,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: WkColors.glassBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: WkColors.glassBorder),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            ),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: WkColors.brandRed))
              : _error != null
                  ? _ErrorBanner(message: _error!, onRetry: _loadMissions)
                  : _pins.isEmpty
                      ? const _EmptyBanner()
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _pins.length,
                          itemBuilder: (_, i) {
                            final pin = _pins[i];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: GestureDetector(
                                onTap: () => _showMissionDetail(pin),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: WkColors.bgSecondary,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: WkColors.glassBorder),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, color: WkColors.brandRed, size: 18),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(pin.title, style: const TextStyle(color: WkColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
                                            if (pin.city != null)
                                              Text(pin.city!, style: const TextStyle(color: WkColors.textTertiary, fontSize: 12)),
                                          ],
                                        ),
                                      ),
                                      Text(
                                        '${pin.price.toInt()} \$',
                                        style: const TextStyle(color: WkColors.brandRed, fontWeight: FontWeight.w700, fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// State banners

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: WkColors.error, size: 40),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: WkColors.textSecondary, fontSize: 14)),
            const SizedBox(height: 16),
            TextButton(
              onPressed: onRetry,
              child: const Text('Réessayer', style: TextStyle(color: WkColors.brandRed)),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyBanner extends StatelessWidget {
  const _EmptyBanner();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.location_off_outlined, color: WkColors.textTertiary, size: 48),
            SizedBox(height: 12),
            Text(
              'Aucun appel de service dans cette zone',
              textAlign: TextAlign.center,
              style: TextStyle(color: WkColors.textSecondary, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mission detail bottom sheet — with real Postuler action

class _MissionDetailSheet extends StatefulWidget {
  const _MissionDetailSheet({required this.pin});
  final MissionPin pin;

  @override
  State<_MissionDetailSheet> createState() => _MissionDetailSheetState();
}

class _MissionDetailSheetState extends State<_MissionDetailSheet> {
  bool _applying = false;

  Future<void> _postuler() async {
    if (_applying) return;
    setState(() => _applying = true);

    // Auth guard: redirect to onboarding if not logged in
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      Navigator.of(context).pop();
      context.go('/onboarding');
      return;
    }

    try {
      await OffersApi().createOffer(missionId: widget.pin.id);
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Candidature envoyée !'),
          backgroundColor: WkColors.success,
        ),
      );
    } on UnauthorizedException {
      if (!mounted) return;
      setState(() => _applying = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez vous connecter pour postuler.'),
          backgroundColor: WkColors.error,
        ),
      );
    } on AlreadyAppliedException {
      if (!mounted) return;
      setState(() => _applying = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vous avez déjà postulé à cette mission.'),
          backgroundColor: WkColors.warning,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _applying = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur : ${e.toString()}'),
          backgroundColor: WkColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final pin = widget.pin;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(WkRadius.bottomSheet)),
        border: const Border(
          top: BorderSide(color: WkColors.bgQuaternary, width: 0.5),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36, height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: WkColors.bgQuaternary,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Header row: title + price
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pin.title,
                      style: const TextStyle(
                        fontFamily: 'General Sans',
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: WkColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      pin.category,
                      style: const TextStyle(
                        fontFamily: 'General Sans',
                        fontSize: 13,
                        color: WkColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  gradient: WkColors.gradientPremium,
                  borderRadius: BorderRadius.circular(WkRadius.pill),
                  boxShadow: WkColors.shadowPremium,
                ),
                child: Text(
                  '${pin.price.toInt()} \$',
                  style: const TextStyle(
                    fontFamily: 'General Sans',
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Status + location + badge row
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              if (pin.status == 'open')
                WkBadge.available()
              else
                WkBadge.custom(
                  label: pin.status,
                  color: WkColors.textTertiary,
                  backgroundColor: WkColors.bgTertiary,
                ),
              if (pin.city != null)
                WkBadge.custom(
                  label: pin.city!,
                  icon: Icons.location_on_outlined,
                  color: WkColors.textSecondary,
                  backgroundColor: WkColors.bgTertiary,
                ),
              WkBadge.custom(
                label: WkCopy.neutralPlatform.substring(0, 12) + '…',
                icon: Icons.shield_outlined,
                color: WkColors.textTertiary,
                backgroundColor: WkColors.bgTertiary,
              ),
            ],
          ),
          const SizedBox(height: 20),
          // CTA
          SizedBox(
            width: double.infinity,
            height: 52,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: _applying ? null : WkColors.gradientPremium,
                color: _applying ? WkColors.bgTertiary : null,
                borderRadius: BorderRadius.circular(WkRadius.pill),
                boxShadow: _applying ? [] : WkColors.shadowPremium,
              ),
              child: ElevatedButton(
                onPressed: _applying ? null : _postuler,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: Colors.white,
                  shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(WkRadius.pill),
                  ),
                ),
                child: _applying
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text(
                        'Postuler maintenant',
                        style: TextStyle(
                          fontFamily: 'General Sans',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FiltersSheet extends StatefulWidget {
  const _FiltersSheet({required this.initialRadius, required this.onApply});

  final double initialRadius;
  final void Function(double radius) onApply;

  @override
  State<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends State<_FiltersSheet> {
  late double _radius;

  @override
  void initState() {
    super.initState();
    _radius = widget.initialRadius;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Filtres',
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: WkColors.textPrimary,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Rayon de recherche', style: TextStyle(color: WkColors.textSecondary)),
              Text(
                '${_radius.toInt()} km',
                style: const TextStyle(color: WkColors.brandRed, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          Slider(
            value: _radius,
            min: 1,
            max: 50,
            divisions: 49,
            activeColor: WkColors.brandRed,
            onChanged: (v) => setState(() => _radius = v),
            label: '${_radius.toInt()} km',
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              widget.onApply(_radius);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: WkColors.brandRed,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Appliquer'),
          ),
        ],
      ),
    );
  }
}
