import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_store.dart';
import '../../../shared/models/choices.dart';
import '../../../shared/models/wallpaper.dart';
import '../../device/application/device_providers.dart';
import '../../generation/data/generation_repository.dart';

final createFormProvider = NotifierProvider<CreateFormController, CreateForm>(
  CreateFormController.new,
);

class CreateFormController extends Notifier<CreateForm> {
  @override
  CreateForm build() => CreateForm(
    style: StyleChoice.fromApi(
      ref.read(localStoreProvider).readString(StoreKeys.vibe),
    ),
    mood: MoodChoice.dream,
    primary: ColorChoice.purple,
    secondary: ColorChoice.cyan,
  );

  void update(CreateForm Function(CreateForm form) change) =>
      state = change(state);
}

final generationControllerProvider =
    NotifierProvider<GenerationController, AsyncValue<Wallpaper?>>(
      GenerationController.new,
    );

class GenerationController extends Notifier<AsyncValue<Wallpaper?>> {
  @override
  AsyncValue<Wallpaper?> build() => const AsyncData(null);

  Future<void> generate() async {
    if (state.isLoading) return;
    final form = ref.read(createFormProvider);
    final device = ref.read(currentDeviceProvider);
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(generationRepositoryProvider).generate(form, device),
    );
  }
}
