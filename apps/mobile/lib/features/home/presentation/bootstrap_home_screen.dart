import 'package:connuoc_viet/core/config/app_config.dart';
import 'package:connuoc_viet/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BootstrapHomeScreen extends ConsumerWidget {
  const BootstrapHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.appTitle)),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 640),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.bootstrapHeading,
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 12),
                  Text(l10n.bootstrapDescription),
                  const SizedBox(height: 20),
                  Text(l10n.configuredApiLabel(config.apiBaseUrl.host)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
